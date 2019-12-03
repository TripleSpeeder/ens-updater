const Web3 = require('web3')

const createWeb3 = async ({verbose, provider}) => {
    verbose && console.log('Setting up web3...')

    if (provider === undefined) {
        throw Error(`Failed to initialize web3. provider is undefined.`)
    }

    try {
        let web3 = new Web3(provider)
        return {
            web3,
        }
    } catch (error) {
        throw Error(`Failed to initialize web3 at ${provider}: ${error.message}`)
    }
}

module.exports = createWeb3