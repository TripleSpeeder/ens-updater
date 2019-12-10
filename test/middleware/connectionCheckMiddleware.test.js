const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const connectionCheckMiddleware = require('../../src/middleware/connectionCheckMiddleware')

describe('connectionCheckMiddleware', function() {

    it("should fail with invalid http provider", function() {
        const options = {
            verbose: false,
            web3: 'http://in.val.id:4321',
        }
        assert.isRejected( connectionCheckMiddleware(options), /Node is not reachable/)
    })

    it("should fail with invalid websocket provider", function() {
        const options = {
            verbose: false,
            web3: 'ws://in.val.id:4321',
        }
        assert.isRejected( connectionCheckMiddleware(options), /Node is not reachable/)
    })

    it("should succeed with valid http provider", function() {
        const options = {
            verbose: false,
            web3: 'http://127.0.0.1:8545',
        }
        assert.isFulfilled(connectionCheckMiddleware(options))
    })

    it("should succeed with valid websocket provider", function() {
        const options = {
            verbose: false,
            web3: 'ws://127.0.0.1:8545',
        }
        assert.isFulfilled(connectionCheckMiddleware(options))
    })
})