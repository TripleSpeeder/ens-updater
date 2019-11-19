exports.command = 'setContenthash'
exports.describe = 'Set the contenthash for an ENS name'
exports.builder  = (yargs) => {
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
}

exports.handler = async (argv) => {
    const verbose = !argv.quiet
    let contentHash = argv.contenthash

    if (contentHash === 'stdin') {
        verbose && console.log('Getting contenthash from stdin...')
        contentHash = fs.readFileSync(0).toString().trim();
        verbose && console.log(`\t Got contenthash: ${contentHash}.`)
    }
    let result = await argv.updater.setContenthash({
        dryrun: argv.dryRun,
        contentType: argv.contenttype,
        contentHash: argv.contentHash,
    })
    console.log(result)
}
