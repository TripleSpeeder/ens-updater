const assert = require('chai').assert
const providerMiddlerware = require('../../src/middleware/providerMiddleware')

describe('providerMiddleware', function() {

    it("should return plain connectionstring when no account required", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: 'connectionstring',
            requiresAccount: false
        }
        const expected = {
            provider: options.web3,
        }
        assert.deepEqual(providerMiddlerware(options), expected)
    })

    it("should return HDWalletProvider when account is required (with mnemonic)")

    it("should fail when account is required but mnemonic is invalid")

    it("should return HDWalletProvider when account is required (with private key)")

    it("should fail when account is required and neither mnemonic nor private key are provided", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: 'connectionstring',
            requiresAccount: true,
        }
        assert.throws(()=>{providerMiddlerware(options)}, Error, /No account available./)
    })

    it("should fail when account is required and both mnemonic and private key are provided")

})