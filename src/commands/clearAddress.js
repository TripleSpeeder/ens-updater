const {formatsByName} = require('@ensdomains/address-encoder')

exports.command = 'clearAddress <ensname> [coinname]'

exports.describe = 'Clear address record'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
    .positional('coinname', {
        description: 'Blockchain/Cryptocurrency address type to clear',
        type: 'string',
        choices: Object.keys(formatsByName),
        default: 'ETH'
    })
}

exports.handler = async ({coinname, updater}) => {
    // get SLIP-0044 coinType from coinname
    const coinType = formatsByName[coinname].coinType
    let result = await updater.clearAddress(coinType)
    console.log(result)
    await updater.stop()
    // hardwire process.exit(0) here to fix problems with dangling HDWalletProvider engine for good.
    process.exit(0)
}
