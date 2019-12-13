const assert = require('chai').assert
const gaspriceMiddleware = require('../../src/middleware/gaspriceMiddleware')
const Web3 = require('web3')

describe('gaspriceMiddleware', function() {

    it("should convert provided gasPrice from gwei number to wei BN", function() {
        const options = {
            gasPrice: 10
        }
        const expectedGwei = Web3.utils.toBN(10)
        const expected = {
            gasPrice: Web3.utils.toWei(expectedGwei, 'gwei'),
        }
        const result = gaspriceMiddleware(options)
        assert.deepEqual(result, expected)
    })

    it("should fail when provided gasprice is too high", function() {
        const options = {
            gasPrice: '501'
        }
        assert.throws(()=>{gaspriceMiddleware(options)}, Error, /Gas price too high/)
    })

})