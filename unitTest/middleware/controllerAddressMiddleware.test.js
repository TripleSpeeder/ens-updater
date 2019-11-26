const sinon = require('sinon');
const chai = require("chai");
const assert = chai.assert;
const getControllerAddress = require('../../src/middleware/controllerAddressMiddleware')

describe('controllerAddressMiddleware', function() {

    const controllerAddress = '0x123456789'
    const fakeProvider = {
        getAddress: sinon.fake.returns(controllerAddress)
    }

    it("should get controller when account is required", function() {
        const options = {
            requiresAccount: true,
            provider: fakeProvider,
        }
        const result = getControllerAddress(options)
        assert.deepEqual(result, {controllerAddress: controllerAddress})
    })

    it("should not get controller when no account is required", function() {
        const options = {
            requiresAccount: false,
            provider: fakeProvider
        }
        const result = getControllerAddress(options)
        assert.deepEqual(result, {})
    })

})