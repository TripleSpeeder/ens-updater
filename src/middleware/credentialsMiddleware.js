
const getCredentials = ({requiresAccount}) => {
    if (requiresAccount) {
        // use HDWalletProvider with mnemonic or private string
        const mnemonic = process.env.MNEMONIC
        const private_key = process.env.PRIVATE_KEY
        if ((mnemonic !== undefined) && (private_key !== undefined)) {
            throw Error('Got both mnemonic and private key')
        }
        if (mnemonic) {
            return {mnemonic}
        } else if (private_key) {
            return {private_key}
        } else {
            throw Error('Got neither mnemonic nor private key')
        }
    } else {
        return {}
    }
}

module.exports = getCredentials