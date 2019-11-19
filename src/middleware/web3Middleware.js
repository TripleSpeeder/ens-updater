const Web3 = require('web3')

const createWeb3 = async ({verbose, provider}) => {
    verbose && console.log('Setting up web3...')
    try {
        let web3 = new Web3(provider)
        if (verbose) {
            let chainId = await web3.eth.getChainId()
            let netId = await web3.eth.net.getId()
            console.log(`\tRunning chain ID ${chainId} on network ${netId}`)
        }
        return {web3}
    } catch (error) {
        throw Error(`Failed to initialize web3 at ${provider}: ${error.message}` )
    }
}

module.exports = createWeb3