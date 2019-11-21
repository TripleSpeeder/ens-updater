exports.command = 'getInfo <ensname>'

exports.describe = 'Get various info about ENS name'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
}

exports.handler = async ({updater}) => {
    let info = await updater.getInfo()
    console.log(info)
}
