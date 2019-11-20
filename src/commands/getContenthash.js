exports.command = 'getContenthash'

exports.describe = 'Get the contenthash for an ENS name'

exports.handler = async ({updater}) => {
    let {codec, hash} = await updater.getContenthash()
    console.log(`${codec}: ${hash}`)
}
