const isReachable = require('is-reachable');

const connectionCheck = async ({verbose, web3}) => {
    verbose && console.log(`Checking connectivity of web3 node at ${web3}...`)
    // Do initial check if there is a service running on provided endpoint. Relying on Web3/HDWalletProvider
    // to fail in case node is not reachable is flaky, see https://github.com/TripleSpeeder/ens-updater/issues/25
    const nodeIsReachable = await isReachable(web3)
    if (!nodeIsReachable) {
        throw Error(`Node is not reachable at ${web3}`)
    }
    verbose && console.log('\tConnection check successfull.')
}

module.exports = connectionCheck