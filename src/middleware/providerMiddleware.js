const HDWalletProvider = require('@truffle/hdwallet-provider')

const createProvider = ({verbose, requiresAccount, accountIndex, web3}) => {
    verbose && console.log('Setting up web3 provider...')
    let provider
    if (requiresAccount) {
        // use HDWalletProvider with mnemonic or private string
        const mnemonic = process.env.MNEMONIC
        const private_key = process.env.PRIVATE_KEY

        if (mnemonic) {
            try {
                provider = new HDWalletProvider(mnemonic, web3, accountIndex, accountIndex+1)
            } catch (error) {
                throw Error(`\tCould not initialize HDWalletProvider with mnemonic: ${error}`)
            }
        } else if (private_key) {
            try {
                provider = new HDWalletProvider(private_key, web3)
            } catch (error) {
                throw Error(`\tCould not initialize HDWalletProvider with privatekey: ${error}`)
            }
        } else {
            throw Error(`No account available. Make sure to provide either PRIVATE_KEY or MNEMONIC through .env`)
        }
    } else {
        // just use plain connection string as provider
        provider = web3
    }

    return {
        provider,
    }
}

module.exports = createProvider