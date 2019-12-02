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
    try {
        let result = await updater.clearAddress({
            dryrun,
        })
        console.log(result)
        process.exit(0)
    } finally {
        //updater.stop()
    }
}
