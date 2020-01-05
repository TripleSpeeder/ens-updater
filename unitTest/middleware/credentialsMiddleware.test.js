const assert = require('chai').assert
const getCredentials = require('../../src/middleware/credentialsMiddleware')

describe('getCredentialsMiddleware', function() {

    beforeEach(function () {
        delete process.env['MNEMONIC']
        delete process.env['PRIVATE_KEY']
    })

    it('should not return anything if account is not required', function() {
        const options = {
            requiresAccount: false
        }
        const expected = {}
        assert.deepEqual(getCredentials(options), expected)
    })

    it('should return private_key if account is required', function() {
        const PRIVATE_KEY = 'PRIVATE_KEY_STRING'
        const options = {
            requiresAccount: true
        }
        process.env.PRIVATE_KEY = PRIVATE_KEY
        const expected = {
            private_key: PRIVATE_KEY
        }
        assert.deepEqual(getCredentials(options), expected)

    })

    it('should return mnemonic if account is required', function() {
        const MNEMONIC = 'MNEMONIC_STRING'
        const options = {
            requiresAccount: true
        }
        process.env.MNEMONIC = MNEMONIC
        const expected = {
            mnemonic: MNEMONIC
        }
        assert.deepEqual(getCredentials(options), expected)
    })

    it('should throw if both private_key and mnemonic are set', function() {
        const PRIVATE_KEY = 'PRIVATE_KEY_STRING'
        const MNEMONIC = 'MNEMONIC_STRING'
        const options = {
            requiresAccount: true
        }
        process.env.PRIVATE_KEY = PRIVATE_KEY
        process.env.MNEMONIC = MNEMONIC
        assert.throws(()=>{getCredentials(options)}, /Got both mnemonic and private key/)
    })

    it('should throw if account is required but neither mnemonic or private key is set', function() {
        const options = {
            requiresAccount: true
        }
        assert.throws(()=>{getCredentials(options)}, /Got neither mnemonic nor private key/)
    })
})