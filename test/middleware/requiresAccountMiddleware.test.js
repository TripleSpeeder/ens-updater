const assert = require('chai').assert
const requiresAccount = require('../../src/middleware/requiresAccountMiddleware')

describe('requiresAccountMiddleware', function() {
    const cmdsNeedAccount = ['setContenthash', 'setAddress']
    const cmdsDontNeedAccount = ['getAddress', 'getContentHash', 'getInfo', 'listInterfaces']

    it("should throw on unknown commands", function() {
        const testargv = {
            _: ['unknownCommand']
        }
        assert.throws(() => {requiresAccount(testargv)}, Error)
    })

    cmdsNeedAccount.forEach(function(cmd) {
        it(`should require account for cmd ${cmd}`, function() {
            const testargv = {
                _: [cmd]
            }
            const result = requiresAccount(testargv)
            assert.deepEqual(result, {requiresAccount: true})
        })
    })

    cmdsDontNeedAccount.forEach(function(cmd) {
        it(`should not require account for cmd ${cmd}`, function() {
            const testargv = {
                _: [cmd]
            }
            const result = requiresAccount(testargv)
            assert.deepEqual(result, {requiresAccount: false})
        })
    })
})