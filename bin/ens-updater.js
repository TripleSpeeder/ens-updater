#!/usr/bin/env node
require('dotenv').config()
const fs = require('fs');
const yargs = require('yargs')
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const Updater = require('../lib/index')


const main = async () => {
    try {
        let requiresAccount = false
        const argv = yargs
        .scriptName('ens-updater')
        .usage('Usage: $0 <command> [options]')
        .command('setContenthash', 'Set the contenthash for an ENS name',
            // builder
            (yargs) => {
                return yargs.options({
                    'contenttype': {
                        alias: 'type',
                        description: 'Type of content hash to set (e.g ipfs-ns, swarm-ns, ...)',
                        type: 'string',
                        demandOption: true,
                    },
                    'contenthash': {
                        alias: 'hash',
                        description: 'Content hash to set or \'stdin\' to read from stdin',
                        type: 'string',
                        demandOption: true,
                    }
                })
            },
            // handler
            () => {
                requiresAccount = true
            }
        )
        .command('getContenthash', 'Get the contenthash for an ENS name')
        .command('setAddress', 'Set the address for an ENS name',
            (yargs) => {
                return yargs.options({
                    'address': {
                        description: 'Ethereum address to set',
                        type: 'string',
                        demandOption: true,
                    }
                })
            },
            () => {
                requiresAccount = true
            }
        )
        .command('getAddress', 'Get the address for an ENS name')
        .command('listInterfaces', 'Get all supported interfaces of Resolver')
        .demandCommand(1)
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
            'dry-run': {
                description: 'Do not perform any real transactions',
                type: 'boolean',
                default: false,
                demandOption: false,
            },
            'quiet': {
                description: 'Suppress console output. Set this when running from a script/CI environment',
                alias: 'q',
                type: 'boolean',
                default: false,
                demandOption: false,
            },
            'registryaddress': {
                description: 'Optional contract address of the ENS Registry.',
                type: 'string',
                demandOption: false,
            }
        })
        .help()
        .alias('help', 'h')
        .strict()
        .epilog('contact: michael@m-bauer.org')
        .epilog('github: https://github.com/TripleSpeeder/ens-updater')
        .argv

        // get commandline options
        const command = argv._[0]
        const connectionString = argv.web3
        const accountIndex = argv.accountindex
        const dryrun = argv.dryRun //yes, yargs magic converts dry-run to dryRun
        const ensName = argv.ensname
        const contentType = argv.contenttype
        const verbose = !argv.quiet
        const registryAddress = argv.registryaddress
        let contentHash = argv.contenthash
        let controllerAddress

        if (contentHash === 'stdin') {
            verbose && console.log('Getting contenthash from stdin...')
            contentHash = fs.readFileSync(0).toString().trim();
            verbose && console.log(`\t Got contenthash: ${contentHash}.`)
        }

        verbose && console.log('Setting up web3 provider...')
        if (requiresAccount) {
            // use HDWalletProvider with mnemonic or private string
            const mnemonic = process.env.MNEMONIC
            const private_key = process.env.PRIVATE_KEY

            if (mnemonic) {
                try {
                    provider = new HDWalletProvider(mnemonic, connectionString, accountIndex, accountIndex+1)
                } catch (error) {
                    throw Error(`\tCould not initialize HDWalletProvider with mnemonic: ${error}`)
                }
            } else if (private_key) {
                try {
                    provider = new HDWalletProvider(private_key, connectionString)
                } catch (error) {
                    throw Error(`\tCould not initialize HDWalletProvider with privatekey: ${error}`)
                }
            } else {
                throw Error(`No account available. Make sure to provide either PRIVATE_KEY or MNEMONIC through .env`)
            }
            controllerAddress = provider.getAddress(accountIndex).toLowerCase()
        } else {
            // just use plain connection string as provider
            provider = connectionString
        }

        verbose && console.log('Setting up web3')
        try {
            web3 = new Web3(provider)
            chainId = await web3.eth.getChainId()
            netId = await web3.eth.net.getId()
            verbose && console.log(`\tRunning chain ID ${chainId} on network ${netId}`)
        } catch (error) {
            throw Error(`Failed to initialize web3 at ${connectionString}` )
        }

        const setupOptions = {
            web3: web3,
            ensName: ensName,
            controllerAddress: controllerAddress,
            verbose: verbose,
            registryAddress: registryAddress
        }
        const updater = new Updater()
        await updater.setup(setupOptions)

        switch(command) {
            case 'setContenthash':
                await updater.setContenthash({
                    dryrun: dryrun,
                    contentType: contentType,
                    contentHash: contentHash,
                })
                break
            case 'getContenthash':
                let {codec, hash} = await updater.getContenthash()
                console.log(`${codec}: ${hash}`)
                break
            case 'setAddress':
                await updater.setAddress({
                    address,
                    dryrun
                })
                break
            case 'getAddress':
                let address = await updater.getAddress()
                console.log(address)
                break
            case 'listInterfaces':
                let interfaces = await updater.listInterfaces()
                if (interfaces.length) {
                    console.log(`Resolver supports ${interfaces.length} interfaces:`)
                    for (const i of interfaces) {
                        console.log(` - ${i}`)
                    }
                } else {
                    console.log(`Resolver does not support any interface`)
                }
                break
            default:
                console.error(`unhandled command ${command}`)
                break
        }
        process.exit(0)
    } catch(error) {
        console.error(`Error occured: ${error.message}`)
        process.exit(1)
    }
}

main()
