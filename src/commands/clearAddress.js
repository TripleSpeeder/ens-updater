const fs = require('fs')

exports.command = 'clearAddress <ensname>'

exports.describe = 'Clear address record for an ENS name'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
}

exports.handler = async ({verbose, updater, dryrun}) => {
    let result = await updater.clearAddress({
        dryrun,
    })
    console.log(result)
    await updater.stop()
    // hardwire process.exit(0) here to fix problems with dangling HDWalletProvider engine for good.
    process.exit(0)
}
