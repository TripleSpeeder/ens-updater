const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const PublicResolver = artifacts.require("@ensdomains/resolver/PublicResolver");
const namehash = require('eth-ens-namehash');
const Updater = require('../../lib')
const ResolverInterfaces = require('../../lib/ResolverInterfaces')
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

contract("lib - listinterface functions", function(accounts) {
    const accountIndex = 1;
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName
    const tld = 'test'
    const label = 'wayne'
    const ensName = label + '.' + tld
    const node = namehash.hash(ensName) // for querying
    let updater
    let registryAddress

    before("Get registry address and set resolver", async function () {
        const registry = await ENSRegistry.deployed()
        const resolver = await PublicResolver.deployed()
        await registry.setResolver(node, resolver.address, {from: controller})
        registryAddress = registry.address
    })

    beforeEach("provide fresh updater instance", async function () {
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

    it("should list supported interfaces", async function () {
        let requiredInterfaceNames = Object.keys(ResolverInterfaces)
        let supportedInterfaceNames = await updater.listInterfaces()
        assert.sameMembers(requiredInterfaceNames, supportedInterfaceNames)
    })
})
