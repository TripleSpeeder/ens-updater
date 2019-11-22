#!/usr/bin/env node
require('dotenv').config()
const yargs = require('yargs')
const requiresAccount = require('../src/middleware/requiresAccountMiddleware')
const createProvider = require('../src/middleware/providerMiddleware')
const createWeb3 = require('../src/middleware/web3Middleware')
const createUpdater = require('../src/middleware/updaterMiddleware')

const main = () => {
    const argv = yargs
    .usage('Usage: $0 <command> [options]')
    .middleware(requiresAccount)
    .middleware(createProvider)
    .middleware(createWeb3)
    .middleware(createUpdater)
    // .command(require('../src/commands/getInfo'))
    .command(require('../src/commands/setContenthash'))
    .command(require('../src/commands/getContenthash'))
    .command(require('../src/commands/setAddress'))
    .command(require('../src/commands/getAddress'))
    .command(require('../src/commands/listInterfaces'))
    .demandCommand(1)
    .options({
        'verbose': {
            description: "Verbose output",
            alias: 'v',
            type: 'boolean',
            default: false,
            demandOption: false,
        },
        'web3': {
            description: 'Web3 connection string',
            type: 'string',
            demandOption: true,
        },
        'dry-run': {
            description: 'Do not perform any real transactions',
            type: 'boolean',
            default: false,
            demandOption: false,
        },
        'accountindex': {
            alias: 'i',
            description: 'Account index. Defaults to 0',
            default: 0,
            type: 'number',
        },
        'registryaddress': {
            description: 'Optional contract address of the ENS Registry.',
            type: 'string',
            demandOption: false,
        },
    })
    .config()
    .help()
    .alias('help', 'h')
    .strict()
    .completion()
    .epilog('contact: michael@m-bauer.org')
    .epilog('github: https://github.com/TripleSpeeder/ens-updater')
    .argv
}

main()
