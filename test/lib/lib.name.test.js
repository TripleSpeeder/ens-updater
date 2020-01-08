const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const Updater = require('../../lib')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

/* global web3 */

let updater
let registryAddress

contract('lib - reverse name estimategas', function(accounts) {
    const accountIndex = 2
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach('provide fresh updater instance', async function() {
        const updaterOptions = {
            web3: web3,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            estimateGas: true,
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ('should return gas estimate for getting reverse name', async function() {
        let gasEstimate = await updater.getReverseName(controller)
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)
    })

    it ('should return gas estimate for setting reverse name', async function() {
        // update reverse name with estimateGas option set
        let newName = 'another.test'
        let gasEstimate = await updater.setReverseName(newName)
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)
    })
})

contract('lib - reverse name getter', function(accounts) {

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach('provide fresh updater instance', async function() {
        const updaterOptions = {
            web3: web3,
            registryAddress: registryAddress,
            verbose: false,
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ('should fail when invalid address is provided', function() {
        let address = '0xsomeThing'
        assert.isRejected(updater.getReverseName(address))
    })

    it ('should handle no reverseResolver being set', async function() {
        let address = accounts[1]
        let reverseName = await updater.getReverseName(address)
        assert.strictEqual(reverseName, '')
    })

    it ('should handle reverseResolver being set and name record not being set', async function() {
        let address = accounts[3]
        let reverseName = await updater.getReverseName(address)
        assert.strictEqual(reverseName, '')
    })

    it ('should get reverse name record for address', async function() {
        let address = accounts[2]
        let reverseName = await updater.getReverseName(address)
        assert.strictEqual(reverseName, 'reverse.test')
    })
})

contract('lib - reverse name setter', function(accounts) {
    const accountIndex = 4
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    it ('should not set reverse name with --dry-run option', async function() {
        const updaterOptions = {
            web3: web3,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: true
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
        let currentName = await updater.getReverseName(controller)
        let newName = 'yetanother.test'
        await updater.setReverseName(newName)
        let updatedName = await updater.getReverseName(controller)
        assert.strictEqual(updatedName, currentName)
    })

    it ('should set reverse name', async function() {
        const updaterOptions = {
            web3: web3,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
        let newName = 'aaanditsgone.test'
        await updater.setReverseName(newName)
        let updatedName = await updater.getReverseName(controller)
        assert.strictEqual(updatedName, newName)
    })

    it ('should clear reverse name for address')
})
