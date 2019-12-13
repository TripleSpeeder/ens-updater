const Web3 = require('web3')
const maxGaspriceGWei = 500

const gaspriceMiddleware = ({verbose, gasPrice}) => {
    // check limits
    if (gasPrice > maxGaspriceGWei) {
        throw Error(`Gas price too high. Maximum possible value is ${maxGaspriceGWei} gwei (provided value: ${gasPrice})`)
    }
    // convert to wei BN instance
    const gwei = Web3.utils.toBN(gasPrice)
    const wei = Web3.utils.toWei(gwei, 'gwei')
    verbose && console.log(`Setting gas price: ${gasPrice} gwei`)
    return {
        gasPrice: wei
    }
}

module.exports = gaspriceMiddleware