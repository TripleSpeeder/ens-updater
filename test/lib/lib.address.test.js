const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const Updater = require('../../lib')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

/* global web3 */

const accountIndex = 1
const tld = 'test'
const label = 'wayne'
const ensName = label+'.'+tld
let updater
let registryAddress
const coinTypeETH = 60

contract('lib - address functions dry-run', function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach('provide fresh updater instance', async function() {
        const updaterOptions = {
            web3: web3,
            ensName: ensName,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: true,
            gasPrice: web3.utils.toBN('10000000000')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ('should fail when setting invalid address record', async function() {
        let newaddress = '0xsomeThing'
        assert.isRejected(updater.setAddress({
            address: newaddress,
            coinType: coinTypeETH
        }))
    })

    it ('should not change ETH address when dry-run option is set', async function() {
        let currentaddress = await updater.getAddress(coinTypeETH)
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        await updater.setAddress({
            address: newaddress,
            coinType: coinTypeETH
        })
        let updatedAddress = await updater.getAddress(coinTypeETH)
        assert.strictEqual(updatedAddress, currentaddress)
    })

})

contract('lib - address functions estimategas', function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    let updaterOptions = {
        web3: web3,
        ensName: ensName,
        registryAddress: undefined,
        controllerAddress: controller,
        verbose: false,
        dryrun: false,
        estimateGas: false,
        gasPrice: web3.utils.toBN('10000000000')
    }

    let updaterOptions_estimate = {
        web3: web3,
        ensName: ensName,
        registryAddress: undefined,
        controllerAddress: controller,
        verbose: false,
        dryrun: false,
        estimateGas: true,
        gasPrice: web3.utils.toBN('10000000000')
    }

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        updaterOptions.registryAddress = registry.address
        updaterOptions_estimate.registryAddress = registry.address
    })

    it ('should return gas estimate for read-only method', async function() {
        updater = new Updater()
        await updater.setup(updaterOptions_estimate)
        let gasEstimate = await updater.getAddress(coinTypeETH)
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)
    })

    it ('should return gas estimate and not change anything', async function() {
        updater = new Updater()
        await updater.setup(updaterOptions)
        let currentaddress = await updater.getAddress(coinTypeETH)

        // update address with estimateGas option set
        await updater.setup(updaterOptions_estimate)
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        let gasEstimate = await updater.setAddress({
            address: newaddress,
            coinType: coinTypeETH
        })
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)

        // double check nothing was changed
        await updater.setup(updaterOptions)
        let updatedAddress = await updater.getAddress(coinTypeETH)
        assert.strictEqual(updatedAddress, currentaddress)
    })

})

contract('lib - address functions', function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach('provide fresh updater instance', async function() {
        const updaterOptions = {
            web3: web3,
            ensName: ensName,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: false,
            gasPrice: web3.utils.toBN('10000000000')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ('should return zero address when no address is set', async function() {
        const zeroAddress = '0x0000000000000000000000000000000000000000'
        let address = await updater.getAddress(coinTypeETH)
        assert.strictEqual(address, zeroAddress)
    })

    it ('should fail when setting invalid address record', async function() {
        let newaddress = '0xsomeThing'
        assert.isRejected(updater.setAddress({
            address: newaddress,
            coinType: coinTypeETH
        }))
    })

    it ('should set ETH address record with valid address', async function() {
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        await updater.setAddress({
            address: newaddress,
            coinType: coinTypeETH
        })
        let updatedAddress = await updater.getAddress(coinTypeETH)
        assert.strictEqual(updatedAddress, newaddress)
    })

    it ('should fail when resolver is required but not set', async function() {
        const updaterOptions = {
            web3: web3,
            ensName: 'noresolver.test',
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: false,
            gasPrice: web3.utils.toBN('10000000000')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)

        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        assert.isRejected(updater.setAddress(
            {
                address: newaddress,
                coinType: coinTypeETH
            }),
            /No resolver set/,
            'Should fail with No Resolver set error')
    })
})
