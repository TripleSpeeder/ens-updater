const fs = require('fs')

exports.command = 'setContenthash <ensname> <contenttype> <contenthash>'

exports.describe = 'Set the contenthash for an ENS name'

exports.builder  = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
    .positional('contenttype', {
        alias: 'type',
        description: 'Type of content hash to set (e.g ipfs-ns, swarm-ns, ...)',
        type: 'string',
        demandOption: true,
    }).positional('contenthash', {
        alias: 'hash',
        description: 'Content hash. Use \'stdin\' to read from stdin',
        type: 'string',
        demandOption: true,
    })
}

exports.handler = async ({verbose, contenttype, contenthash, updater, dryRun, }) => {
    if (contenthash === 'stdin') {
        verbose && console.log('Getting contenthash from stdin...')
        contenthash = fs.readFileSync(0).toString().trim();
        verbose && console.log(`\t Got contenthash: ${contenthash}.`)
    }
    let result = await updater.setContenthash({
        dryrun: dryRun,
        contentType: contenttype,
        contentHash: contenthash,
    })
    console.log(result)
}
