const Web3 = require('web3')

const createWeb3 = async ({verbose, provider}) => {
    verbose && console.log('Setting up web3...')
    try {
        let web3 = new Web3(provider)
        // CHECK HERE - If provider is a HDWalletProvider initialized With an invalid connectionstring this will immediately exit ??? Possibly web3 bug?
        let chainId = await web3.eth.getChainId()
        // let chainId
        // let netId = await web3.eth.net.getId()
        let netId
        if (verbose) {
            console.log(`\tRunning chain ID ${chainId} on network ${netId}`)
        }
        return {
            web3,
            chainId,
            netId
        }
    } catch (error) {
        throw Error(`Failed to initialize web3 at ${provider}: ${error.message}` )
    }
}

module.exports = createWeb3