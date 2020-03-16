const Web3 = require('web3')
const maxGaspriceGWei = 500

const gaspriceMiddleware = ({verbose, gasPrice, requiresAccount}) => {
    // check limits
    if (gasPrice > maxGaspriceGWei) {
        throw Error(`Gas price too high. Maximum possible value is ${maxGaspriceGWei} gwei (provided value: ${gasPrice})`)
    }
    // convert to wei BN instance
    const gwei = Web3.utils.toBN(gasPrice)
    const wei = Web3.utils.toWei(gwei, 'gwei')

    // ignore gas price when command does not require account and no tx will be performed
    if (requiresAccount) {
        verbose && console.log(`Setting gas price: ${gasPrice} gwei`)
    }
    return {
        gasPrice: wei
    }
}

module.exports = gaspriceMiddleware