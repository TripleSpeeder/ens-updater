const assert = require('chai').assert
const HDWalletProvider = require('@truffle/hdwallet-provider')
const providerMiddlerware = require('../../src/middleware/providerMiddleware')

describe('providerMiddleware', function() {

    const VALID_MNEMONIC = 'arrest erupt vintage embrace coast shoulder pond cattle toy hello cloud nurse'
    const INVALID_MNEMONIC = 'some garbage text'
    const VALID_CONNECTIONSTRING = 'http://localhost:8545'
    const PRIVATE_KEY = '0xABCDEF1234567890'

    it("should return plain connectionstring when no account required", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: VALID_CONNECTIONSTRING,
            requiresAccount: false
        }
        const expected = {
            provider: options.web3,
        }
        assert.deepEqual(providerMiddlerware(options), expected)
    })

    it("should return HDWalletProvider when account is required (with mnemonic)", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: VALID_CONNECTIONSTRING,
            requiresAccount: true,
            mnemonic: VALID_MNEMONIC
        }
        const result = providerMiddlerware(options)
        assert.instanceOf(result.provider, HDWalletProvider)
        assert.equal(result.provider.getAddresses().length, 1)
    })

    it("should fail when account is required but mnemonic is invalid", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: VALID_CONNECTIONSTRING,
            requiresAccount: true,
            mnemonic: INVALID_MNEMONIC
        }
        assert.throws(()=>{providerMiddlerware(options)}, Error, /Mnemonic invalid or undefined/)
    })

    it("should return HDWalletProvider with one address when account is required (with private key)", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: VALID_CONNECTIONSTRING,
            requiresAccount: true,
            private_key: PRIVATE_KEY
        }
        const result = providerMiddlerware(options)
        assert.instanceOf(result.provider, HDWalletProvider)
    })

    it("should fail when account is required and neither mnemonic nor private key are provided", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: 'connectionstring',
            requiresAccount: true,
        }
        assert.throws(()=>{providerMiddlerware(options)}, Error, /No account available./)
    })

    it("should fail when account is required and both mnemonic and private key are provided", function() {
        const options = {
            verbose: false,
            accountIndex: 0,
            web3: VALID_CONNECTIONSTRING,
            requiresAccount: true,
            private_key: PRIVATE_KEY,
            mnemonic: VALID_MNEMONIC
        }
        assert.throws(()=>{providerMiddlerware(options)}, Error, /Both PRIVATE_KEY and MNEMONIC are set/)
    })

    it("should return HDWalletProvider with requested number of accounts", function() {
        const accountIndex = 5
        const options = {
            verbose: false,
            accountIndex: accountIndex,
            web3: VALID_CONNECTIONSTRING,
            requiresAccount: true,
            mnemonic: VALID_MNEMONIC
        }
        const result = providerMiddlerware(options)
        assert.instanceOf(result.provider, HDWalletProvider)
        assert.equal(result.provider.getAddresses().length, accountIndex+1)
    })

})