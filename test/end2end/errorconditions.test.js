const Web3 = require('web3')
const contract = require("@truffle/contract");
const execa = require("execa")
const registryData = require("../../build/contracts/ENSRegistry");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const testData = require('./testdata.js')

describe('ens-updater', function() {

    const scriptpath = 'bin/ens-updater.js'
    const web3 = 'http://localhost:8545'
    const ensName = 'wayne.test'
    const controller = testData.accounts[testData.names[ensName].controller]
    let registryAddress

    before("Get registry address", async function() {
        const registryContract = contract(registryData)
        registryContract.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'))
        const registry = await registryContract.deployed()
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
                        PRIVATE_KEY: controller.private_key
                    }
                }
            )
        } catch (childResultError) {
            assert.match(childResultError.stderr, /Failed to initialize web3/)
        }
    })

    it("Should set address record", async function() {
        const targetAddress = testData.accounts[3].address
        const childResult = await execa.node(
            scriptpath,
            ['setAddress', 'wayne.test', targetAddress, '--web3', web3, '--registryAddress', registryAddress],
            {
                env: {
                    PRIVATE_KEY: controller.private_key
                }
            }
        )
        // Expected output is a transaction hash
        assert.match(childResult.stdout, /^0x/)
    })

    it("Should show error message when account is required but no credentials are provided", async function() {
        const targetAddress = testData.accounts[3].address
        try {
            await execa.node(scriptpath, ['setAddress', 'wayne.test', targetAddress, '--web3', web3])
        } catch (childResultError){
            assert.match(childResultError.stderr, /Got neither mnemonic nor private key/)
        }
    })

})