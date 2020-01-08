const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const Updater = require('../../lib')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

/* global web3 */

const accountIndex = 2
let updater
let registryAddress

contract('lib - reverse name estimategas', function(accounts) {
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

    it ('should return gas estimate for setting reverse name'/*, async function() {
        // update reverse name with estimateGas option set
        // eslint-disable-next-line require-atomic-updates
        let newName = 'another.test'
        let gasEstimate = await updater.setName({
            address: controller,
            name: newName
        })
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)
    }*/)
})

contract('lib - reverse name getter', function(accounts) {
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
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ('should fail when invalid address is provided', function() {
        let address = '0xsomeThing'
        assert.isRejected(updater.getReverseName(address))
    })

    it ('should handle no reverseResolver being set', async function() {
        let owner = accounts[1]
        assert.isRejected(updater.getReverseName(owner),/No reverse resolver set/)
    })

    it ('should handle reverseResolver being set and name record not being set', async function() {
        let owner = accounts[3]
        let reverseName = await updater.getReverseName(owner)
        assert.strictEqual(reverseName, '')
    })

    it ('should get reverse name record for address', async function() {
        let reverseName = await updater.getReverseName(accounts[2])
        assert.strictEqual(reverseName, 'reverse.test')
    })
})

contract('lib - reverse name setter', function(accounts) {
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
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ('should fail when invalid address is provided')

    it ('should set reverse name for address')

    it ('should not set reverse name with --dry-run option')

    it ('should clear reverse name for address')
})
