#!/usr/bin/env node
require('dotenv').config()
const yargs = require('yargs')
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const Updater = require('../src/index')


const main = async () => {
    const argv = yargs
    .scriptName('ens-deploy')
    .options({
        'web3': {
            description: 'Web3 connection string',
            type: 'string',
            demandOption: true,
        },
        'accountindex': {
            alias: 'i',
            description: 'Account index. Defaults to 0',
            default: 0,
            type: 'number',
        },
        'ensname': {
            alias: 'ens',
            description: 'ENS Name to update',
            type: 'string',
            demandOption: true,
        },
        'contenttype': {
            alias: 'type',
            description: 'Type of content hash to set (e.g ipfs, swarm, ...)',
            type: 'string',
            demandOption: true,
        },
        'contenthash': {
            alias: 'hash',
            description: 'Content has to set',
            type: 'string',
            demandOption: true,
        },
        'dry-run': {
            description: 'Do not perform any real transactions',
            type: 'boolean',
            demandOption: false,
        },
    })
    .help()
    .alias('help', 'h')
        .argv

    // get commandline options
    const connectionString = argv['web3']
    const accountIndex = argv['accountindex']
    const dryrun = argv['dry-run']
    const ensName = argv['ensname']
    const contentType = argv['contenttype']
    const contentHash = argv['contenthash']
    const mnemonic = process.env.MNEMONIC

    console.log('Setting up web3 & HDWallet provider...')
    try {
        provider = new HDWalletProvider(mnemonic, connectionString, accountIndex)
    } catch (error) {
        console.log('\tCould not initialize HDWalletProvider: ' + error)
        throw error
    }
    try {
        web3 = new Web3(provider)
        chainId = await web3.eth.getChainId()
        console.log('\tRunning on chain ID ' + chainId)
    } catch (error) {
        console.log('\tFailed to initialize web3 at ' + connectionString)
        throw error
    }

    const options = {
        web3: web3,
        ensName: ensName,
        contentType: contentType,
        contentHash: contentHash,
        accountIndex: accountIndex,
        dryrun: dryrun,
    }

    const updater = new Updater()
    updater.setContenthash(options)
}

main()
