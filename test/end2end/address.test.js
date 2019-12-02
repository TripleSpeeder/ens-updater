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
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    const controller = testData.accounts[testData.names[ensName].controller]
    let registryAddress

    before("Get registry address", async function() {
        const registryContract = contract(registryData)
        registryContract.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'))
        const registry = await registryContract.deployed()
        registryAddress = registry.address
    })

    after("Clear address", async function() {
        const childResult = await execa.node(
            scriptpath,
            ['clearAddress', ensName, '--web3', web3, '--registryAddress', registryAddress],
            {
                env: {
                    PRIVATE_KEY: controller.private_key
                }
            }
        )
        // Expected output is a transaction hash
        assert.match(childResult.stdout, /^0x/)
    })

    it("Should fail when no resolver is set", async function() {
        try {
            await execa.node(scriptpath, ['getAddress', 'noresolver.test', '--web3', web3, '--registryAddress', registryAddress])
        } catch(childResultError) {
            assert.match(childResultError.stderr, /No resolver set/)
        }
    })

    it("Should not fail when no address is set", async function() {
        const childResult = await execa.node(scriptpath, ['getAddress', ensName, '--web3', web3, '--registryAddress', registryAddress])
        assert.equal(childResult.stdout, zeroAddress)
    })

    it("Should set address record", async function() {
        const targetAddress = testData.accounts[3].address
        const childResult = await execa.node(
            scriptpath,
            ['setAddress', ensName, targetAddress, '--web3', web3, '--registryAddress', registryAddress],
            {
                env: {
                    PRIVATE_KEY: controller.private_key
                }
            }
        )
        // Expected output is a transaction hash
        assert.match(childResult.stdout, /^0x/)
    })

    it("Should get address record", async function() {
        const targetAddress = testData.accounts[3].address
        const childResult = await execa.node(scriptpath, ['getAddress', ensName, '--web3', web3, '--registryAddress', registryAddress])
        assert.equal(childResult.stdout, targetAddress)
    })

    it("Should clear address record", async function() {
        const childResult = await execa.node(
            scriptpath,
            ['clearAddress', ensName, '--web3', web3, '--registryAddress', registryAddress],
            {
                env: {
                    PRIVATE_KEY: controller.private_key
                }
            }
        )
        // Expected output is a transaction hash
        assert.match(childResult.stdout, /^0x/)

        const clearedResult = await execa.node(scriptpath, ['getAddress', ensName, '--web3', web3, '--registryAddress', registryAddress])
        assert.equal(clearedResult.stdout, zeroAddress)
    })
})