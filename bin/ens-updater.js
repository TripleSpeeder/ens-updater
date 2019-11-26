#!/usr/bin/env node
require('dotenv').config()
const yargs = require('yargs')
const requiresAccount = require('../src/middleware/requiresAccountMiddleware')
const getCredentials = require('../src/middleware/credentialsMiddleware')
const createProvider = require('../src/middleware/providerMiddleware')
const createWeb3 = require('../src/middleware/web3Middleware')
const getControllerAddress = require('../src/middleware/controllerAddressMiddleware')
const createUpdater = require('../src/middleware/updaterMiddleware')

const main = () => {
    const argv = yargs
    .usage('Usage: $0 <command> [options]')
    .middleware(requiresAccount)
    .middleware(getCredentials)
    .middleware(createProvider)
    .middleware(createWeb3)
    .middleware(getControllerAddress)
    .middleware(createUpdater)
    // .command(require('../src/commands/getInfo'))
    .command(require('../src/commands/setContenthash'))
    .command(require('../src/commands/getContenthash'))
    .command(require('../src/commands/setAddress'))
    .command(require('../src/commands/getAddress'))
    .command(require('../src/commands/listInterfaces'))
    .demandCommand(1)
    .options(require('../src/commands/sharedOptions.json'))
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
