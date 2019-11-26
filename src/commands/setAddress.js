const fs = require('fs')

exports.command = 'setAddress <ensname> <address>'

exports.describe = 'Set the address for an ENS name'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
    .positional('address', {
        description: 'Ethereum address. Use \'stdin\' to read from stdin',
        type: 'string',
        demandOption: true,
    })
}

exports.handler = async ({address, verbose, updater, dryrun}) => {
    try {
        if (address === 'stdin') {
            verbose && console.log('Reading address from stdin...')
            address = fs.readFileSync(0).toString().trim()
            verbose && console.log(`\t Got address: ${address}.`)
        }
        let result = await updater.setAddress({
            address,
            dryrun,
        })
        console.log(result)
    } finally {
        updater.stop()
    }
}
