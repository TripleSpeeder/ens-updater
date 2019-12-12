const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const Updater = require('../../lib')
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const accountIndex = 1;
const tld = 'test'
const label = 'wayne'
const ensName = label+'.'+tld
let updater
let registryAddress

contract("lib - address functions dry-run", function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    before("Get registry address", async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach("provide fresh updater instance", async function() {
        const updaterOptions = {
            web3: web3,
            ensName: ensName,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: true,
            gasPrice: web3.utils.fromWei('10000000000', 'gwei')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ("should fail when setting invalid address record", async function() {
        let newaddress = '0xsomeThing'
        assert.isRejected(updater.setAddress({
            address: newaddress
        }))
    })

    it ("should not change ETH address when dry-run option is set", async function() {
        let currentaddress = await updater.getAddress()
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        await updater.setAddress({
            address: newaddress,
        })
        let updatedAddress = await updater.getAddress()
        assert.strictEqual(updatedAddress, currentaddress)
    })

})

contract("lib - address functions estimategas", function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    let updaterOptions = {
        web3: web3,
        ensName: ensName,
        registryAddress: undefined,
        controllerAddress: controller,
        verbose: false,
        dryrun: false,
        estimateGas: false,
        gasPrice: web3.utils.fromWei('10000000000', 'gwei')
    }

    before("Get registry address", async function() {
        const registry = await ENSRegistry.deployed()
        updaterOptions.registryAddress = registry.address
    })

    it ("should return gas estimate for read-only method", async function() {
        updater = new Updater()
        updaterOptions.estimateGas = true
        await updater.setup(updaterOptions)
        let gasEstimate = await updater.getAddress()
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)
    })

    it ("should return gas estimate and not change anything", async function() {
        updater = new Updater()
        updaterOptions.estimateGas = false
        await updater.setup(updaterOptions)
        let currentaddress = await updater.getAddress()

        // update address with estimateGas option set
        updaterOptions.estimateGas = true
        await updater.setup(updaterOptions)
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        let gasEstimate = await updater.setAddress({
            address: newaddress,
        })
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)

        // double check nothing was changed
        updaterOptions.estimateGas = false
        await updater.setup(updaterOptions)
        let updatedAddress = await updater.getAddress()
        assert.strictEqual(updatedAddress, currentaddress)
    })

})

contract("lib - address functions", function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    before("Get registry address", async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach("provide fresh updater instance", async function() {
        const updaterOptions = {
            web3: web3,
            ensName: ensName,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: false,
            gasPrice: web3.utils.fromWei('10000000000', 'gwei')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ("should return zero address when no address is set", async function() {
        const zeroAddress = '0x0000000000000000000000000000000000000000'
        let address = await updater.getAddress()
        assert.strictEqual(address, zeroAddress)
    })

    it ("should fail when setting invalid address record", async function() {
        let newaddress = '0xsomeThing'
        assert.isRejected(updater.setAddress({address: newaddress}))
    })

    it ("should set ETH address record with valid address", async function() {
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        await updater.setAddress({address: newaddress})
        let updatedAddress = await updater.getAddress()
        assert.strictEqual(updatedAddress, newaddress)
    })

    it ("should fail when resolver is required but not set", async function() {
        const updaterOptions = {
            web3: web3,
            ensName: 'noresolver.test',
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: false,
            gasPrice: web3.utils.fromWei('10000000000', 'gwei')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)

        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        assert.isRejected(updater.setAddress({address: newaddress}), /No resolver set/, 'Should fail with No Resolver set error')
    })
})
