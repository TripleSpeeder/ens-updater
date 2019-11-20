exports.command = 'getContenthash <ensname>'

exports.describe = 'Get the contenthash for an ENS name'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
}

exports.handler = async ({updater}) => {
    let {codec, hash} = await updater.getContenthash()
    console.log(`${codec}: ${hash}`)
}
