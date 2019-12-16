const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const web3Middleware = require('../../src/middleware/web3Middleware')

describe('web3Middleware', function() {

    it('should fail with invalid provider', function() {
        const options = {
            verbose: false,
            provider: undefined,
        }
        assert.isRejected( web3Middleware(options), /Failed to initialize web3./)
    })

    it('should return web3', async function() {
        // Precondition: Have Ganache running on localhost:8545
        const ganacheProvider = 'http://localhost:8545'
        const options = {
            verbose: false,
            provider: ganacheProvider,
        }
        const result = await web3Middleware(options)
        assert.property(result, 'web3')
    })

})