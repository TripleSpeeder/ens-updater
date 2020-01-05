const {formatsByName} = require('@ensdomains/address-encoder')

exports.command = 'getAddress <ensname> [coinname]'

exports.describe = 'Get address record'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
    .positional('coinname', {
        description: 'Blockchain/Cryptocurrency address to look up',
        type: 'string',
        choices: Object.keys(formatsByName),
        default: 'ETH',
    })
}

exports.handler = async ({coinname, updater}) => {
    // get SLIP-0044 coinType from coinname
    const coinType = formatsByName[coinname].coinType
    try {
        let currentAddress = await updater.getAddress(coinType)
        console.log(currentAddress)
    } finally {
        updater.stop()
    }
}
