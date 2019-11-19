exports.command = 'getAddress'
exports.describe = 'Get the address for an ENS name'
exports.handler = async ({updater}) => {
    let currentAddress = await updater.getAddress()
    console.log(currentAddress)
}
