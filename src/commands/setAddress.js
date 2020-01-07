const fs = require('fs')
const {formatsByName} = require('@ensdomains/address-encoder')

exports.command = 'setAddress <ensname> <address> [coinname]'

exports.describe = 'Set address record'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
    .positional('address', {
        description: 'Address to set or \'stdin\' to read from stdin',
        type: 'string',
    })
    .positional('coinname', {
        description: 'Blockchain/Cryptocurrency address belongs to',
        type: 'string',
        choices: Object.keys(formatsByName),
        default: 'ETH',
    })
}

exports.handler = async ({address, coinname, verbose, updater}) => {
    if (address === 'stdin') {
        verbose && console.log('Reading address from stdin...')
        address = fs.readFileSync(0).toString().trim()
        verbose && console.log(`\t Got address: ${address}.`)
    }
    // get SLIP-0044 coinType from coinname
    const coinType = formatsByName[coinname].coinType
    let result = await updater.setAddress({
        address,
        coinType
    })
    console.log(result)
    await updater.stop()
    // hardwire process.exit(0) here to fix problems with dangling HDWalletProvider engine for good.
    process.exit(0)
}
