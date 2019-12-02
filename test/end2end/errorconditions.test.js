const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const execa = require("execa")
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const controllerAccountIndex = 1
const {private_keys, mnemonic} = require('./testdata')


contract('errorConditions', function(accounts) {

    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    let registryAddress

    before("Get registry address", async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    it("Should show usage info when no commands are specified", async function() {
        try {
            await execa.node(scriptpath)
        } catch(childResultError) {
            assert.match(childResultError.stderr, /Usage: ens-updater.js <command> \[options]/)
        }
    })

    it("Should show error message when web3 connectionstring is invalid and no account required", async function() {
        try {
            await execa.node(scriptpath, ['getContenthash', 'wayne.test', '--web3', 'http://in.val.id:12345'])
        } catch(childResultError) {
            assert.match(childResultError.stderr, /Failed to initialize web3/)
        }
    })

    it("Should show error message when web3 connectionstring is invalid and account is required", async function() {
        try {
            await execa.node(
                scriptpath, ['setAddress', 'wayne.test', '0x123', '--web3', 'http://in.valid:12345'],
                {
                    env: {
                        PRIVATE_KEY: private_keys[controllerAccountIndex]
                    }
                }
            )
        } catch (childResultError) {
            assert.match(childResultError.stderr, /Failed to initialize web3/)
        }
    })

    it("Should show error message when account is required but no credentials are provided", async function() {
        const targetAddress = accounts[3]
        try {
            await execa.node(scriptpath, ['setAddress', 'wayne.test', targetAddress, '--web3', providerstring])
        } catch (childResultError){
            assert.match(childResultError.stderr, /Got neither mnemonic nor private key/)
        }
    })

    it("Should show error message when account is required and both mnemonic and private key are provided", async function() {
        const targetAddress = accounts[3]
        try {
            await execa.node(scriptpath, ['setAddress', 'wayne.test', targetAddress, '--web3', providerstring],
                {
                    env: {
                        MNEMONIC: mnemonic,
                        PRIVATE_KEY: private_keys[controllerAccountIndex]
                    }
                })
        } catch (childResultError){
            assert.match(childResultError.stderr, /Got both mnemonic and private key/)
        }
    })
})