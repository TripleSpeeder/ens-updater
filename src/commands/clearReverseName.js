exports.command = 'clearReverseName'

exports.describe = 'Clear reverse name record of calling address'

exports.builder = (yargs) => {
    return yargs
}

exports.handler = async ({updater}) => {
    let result = await updater.clearReverseName()
    console.log(result)
    await updater.stop()
}
