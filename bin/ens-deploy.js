#!/usr/bin/env node
require('dotenv').config()
var yargs = require('yargs')
var ENS = require('ethereum-ens')
var Web3 = require('web3')
var HDWalletProvider = require('@truffle/hdwallet-provider')
var ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')
var contentHash = require('content-hash')

/*
Parameters:
- web3 connection string
- ens name to update
- type of content hash e.g. "ipfs", "ipns", "swarm", ...
- actual content hash
- optional account index

Flow:
Initiate web3
Initiate hdwallet provider (requires mnemonic in environment)
initiate ENS contract
Query ENS contract to check if current address in fact is set as controller of ENS name
Perform the actual update
 */

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
                type: 'number'
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
                demandOption: false
            }
        })
        .help()
        .alias('help', 'h')
        .argv;

    // get commandline options
    const ensName = argv['ens']
    const contentType = argv['type']
    const hash = argv['hash']
    const connectionString = argv['web3']
    const accountIndex = argv['accountindex']
    const dryrun = argv['dry-run']

    // Get mnemonic from .env
    const mnemonic=process.env.MNEMONIC

    let encodedHash, provider, account, web3, chainId, address, owner

    // validate provided content hash
    try {
        encodedHash = "0x" + contentHash.encode(contentType, hash)
        // console.log("Encoded hash: " + encodedHash)
    } catch(error) {
        console.log("\tCould not encode contenthash: " + error)
        throw error
    }

    console.log("Initializing HDWallet provider...")
    try {
        provider = new HDWalletProvider(mnemonic, connectionString, accountIndex)
    } catch(error) {
        console.log("\tCould not initialize HDWalletProvider: " + error)
        throw error
    }

    console.log("Initializing Web3...")
    try {
        web3 = new Web3(provider)
        chainId = await web3.eth.getChainId()
        console.log("\tRunning on chain ID " + chainId)
    } catch(error)
    {
        console.log("\tFailed to initialize web3 at " + connectionString)
        throw error
    }

    console.log("Initializing Account...")
    try {
        account = await provider.getAddress()
        account = web3.utils.toChecksumAddress(account)
        // TODO: Check for ENS name via reverse registrar
        console.log("\tUsing account " + account)
    } catch (error) {
        console.log("\tCould not initialize account: " + error)
    }

    console.log("Initializing ens system...")
    const ens = new ENS(provider)
    // Don'use default ABI of ethereum-ens package, as it does not yet support contentHash.
    // See https://github.com/ensdomains/ensjs/issues/37
    const resolver = ens.resolver(ensName, ResolverABI.abi)
    try {
        // check if the name can be resolved at all
        address = await resolver.addr()
    } catch(error) {
        console.log(`\tENS name ${ensName} can not be resolved.`)
        throw error
    }

    console.log("Validating ens name controller")
    owner = await ens.owner(ensName);
    if (owner !== account) {
        const msg = `\tAccount ${account} is not controller of ${ensName}. Current controller is ${owner}`
        console.error(msg)
        throw msg
    }

    console.log("Updating content hash record")
    const currentContentHash = await resolver.contenthash()
    if (currentContentHash) {
        console.log("\tExisting contenthash: " + contentHash.getCodec(currentContentHash) + ":" + contentHash.decode(currentContentHash))
    }
    try {
        if (!dryrun) {
            let receipt = await resolver.setContenthash(encodedHash)
            console.log(`\tSuccessfully stored new contentHash ${hash}. Transaction hash: ${receipt.transactionHash}.`)
        } else {
            console.log(`\tSkipped transaction due to dry-run option being set.`)
        }
    } catch(error) {
        console.log("Error creating transaction: " + error)
    }

    // shutdown provider
    console.log("All done, shutting down.")
    provider.engine.stop()
}

main().catch(() => {
    console.log("\nError detected. Aborting.")
    process.exit(1)
})
