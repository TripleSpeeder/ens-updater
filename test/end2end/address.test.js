const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry")
const execa = require("execa")
const chai = require("chai")
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)
const assert = chai.assert


const {private_keys} = require('./testdata')
const controllerAccountIndex = 1


contract('get/set address', function(accounts) {

    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    const ensName = 'wayne.test'
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    let registryAddress

    before("Get registry address", async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    after("Clear address", async function() {
        const childResult = await execa.node(
            scriptpath,
            ['clearAddress', ensName, '--web3', providerstring, '--registryAddress', registryAddress],
            {
                env: {
                    PRIVATE_KEY: private_keys[controllerAccountIndex]
                }
            }
        )
        // Expected output is a transaction hash
        assert.match(childResult.stdout, /^0x/)
    })

    it("Should fail when no resolver is set", async function() {
        try {
            await execa.node(scriptpath, ['getAddress', 'noresolver.test', '--web3', providerstring, '--registryAddress', registryAddress])
        } catch(childResultError) {
            assert.match(childResultError.stderr, /No resolver set/)
        }
    })

    it("Should not fail when no address is set", async function() {
        const childResult = await execa.node(scriptpath, ['getAddress', ensName, '--web3', providerstring, '--registryAddress', registryAddress])
        assert.equal(childResult.stdout, zeroAddress)
    })

    it("Should set address record", async function() {
        const targetAddress = accounts[3]
        const childResult = await execa.node(
            scriptpath,
            ['setAddress', ensName, targetAddress, '--web3', providerstring, '--registryAddress', registryAddress],
            {
                env: {
                    PRIVATE_KEY: private_keys[controllerAccountIndex]
                }
            }
        )
        // Expected output is a transaction hash
        assert.match(childResult.stdout, /^0x/)
    })

    it("Should get address record", async function() {
        const targetAddress = accounts[3]
        const childResult = await execa.node(scriptpath, ['getAddress', ensName, '--web3', providerstring, '--registryAddress', registryAddress])
        assert.equal(childResult.stdout, targetAddress)
    })

    it("Should clear address record", async function() {
        const childResult = await execa.node(
            scriptpath,
            ['clearAddress', ensName, '--web3', providerstring, '--registryAddress', registryAddress],
            {
                env: {
                    PRIVATE_KEY: private_keys[controllerAccountIndex]
                }
            }
        )
        // Expected output is a transaction hash
        assert.match(childResult.stdout, /^0x/)

        const clearedResult = await execa.node(scriptpath, ['getAddress', ensName, '--web3', providerstring, '--registryAddress', registryAddress])
        assert.equal(clearedResult.stdout, zeroAddress)
    })
})