const url = require('url')
const connectionTester = require('connection-tester')

const connectionCheck = async ({verbose, web3}) => {
    verbose && console.log(`Checking connectivity of web3 node at ${web3}...`)
    // Do initial check if there is a service running on provided endpoint. Relying on Web3/HDWalletProvider
    // to fail in case node is not reachable is flaky, see https://github.com/TripleSpeeder/ens-updater/issues/25
    let web3Url = url.parse(web3)
    let port = web3Url.port
    if (!port) {
        // no port specified. Derive from protocol.
        switch(web3Url.protocol) {
            case 'https:':
            case 'wss:':
                port = 443
                break
            case 'http:':
            case 'ws:':
            default:
                port = 80
        }
    }
    const nodeIsReachable = connectionTester.test(web3Url.hostname, port, 2000)
    if (!nodeIsReachable.success) {
        throw Error(`Node is not reachable at ${web3}`)
    }
    verbose && console.log('\tConnection check successfull.')
}

module.exports = connectionCheck