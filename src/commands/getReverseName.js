exports.command = 'getReverseName <address>'

exports.describe = 'Get reverse name record'

exports.builder = (yargs) => {
    return yargs
    .positional('address', {
        description: 'Ethereum address to query',
        type: 'string',
    })
}

exports.handler = async ({updater, address}) => {
    try {
        let reverseName = await updater.getReverseName(address)
        if (reverseName === '') {
            console.log('No reverse name record set')
        } else {
            console.log(reverseName)
        }
    } finally {
        updater.stop()
    }
}
