exports.command = 'getAddress <ensname>'

exports.describe = 'Get the address for an ENS name'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
}

exports.handler = async ({updater}) => {
    let currentAddress = await updater.getAddress()
    console.log(currentAddress)
}
