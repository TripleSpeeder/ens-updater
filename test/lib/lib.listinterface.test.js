const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const Updater = require('../../lib')
const ResolverInterfaces = require('../../lib/ResolverInterfaces')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

/* global web3 */

contract('lib - listinterface functions', function(accounts) {
    const accountIndex = 1
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName
    const tld = 'test'
    const label = 'wayne'
    const ensName = label + '.' + tld
    let updater
    let registryAddress

    before('Get registry address', async function () {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach('provide fresh updater instance', async function () {
        const updaterOptions = {
            web3: web3,
            ensName: ensName,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            gasPrice: web3.utils.toBN('10000000000')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it('should list supported interfaces', async function () {
        let requiredInterfaceNames = Object.keys(ResolverInterfaces)
        let supportedInterfaceNames = await updater.listInterfaces()
        assert.sameMembers(requiredInterfaceNames, supportedInterfaceNames)
    })
})
