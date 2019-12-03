const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const namehash = require('eth-ens-namehash');
const Updater = require('../../lib')
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;


contract("lib - address functions", function(accounts) {
    const accountIndex = 1;
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName
    const tld = 'test'
    const label = 'wayne'
    const ensName = label+'.'+tld
    const node = namehash.hash(ensName)
    let updater
    let registryAddress

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

    it ("should not change ETH address when dry-run option is set", async function() {
        let currentaddress = await updater.getAddress()
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        await updater.setAddress({
            address: newaddress,
            dryrun: true
        })
        let updatedAddress = await updater.getAddress()
        assert.strictEqual(updatedAddress, currentaddress)
    })

    it ("should set ETH address record with valid address", async function() {
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        await updater.setAddress({address: newaddress})
        let updatedAddress = await updater.getAddress()
        assert.strictEqual(updatedAddress, newaddress)
    })
})
