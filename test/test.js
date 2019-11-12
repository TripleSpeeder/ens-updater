var assert = require('chai').assert
const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const FIFSRegistrar = artifacts.require("@ensdomains/ens/FIFSRegistrar");
const ReverseRegistrar = artifacts.require("@ensdomains/ens/ReverseRegistrar");
const PublicResolver = artifacts.require("@ensdomains/resolver/PublicResolver");
const namehash = require('eth-ens-namehash');
const utils = require('web3-utils');
const Updater = require('../src/index')

contract("ipfs", accounts => {
    const accountIndex = 0;
    const owner = accounts[accountIndex] // account that registers and owns ENSName
    const tld = 'test'
    const label = 'dummy'
    const ensName = label+'.'+tld
    const labelHash = utils.sha3(label) // for registering
    const node = namehash.hash(ensName) // for querying

    it(`should register "${ensName}"`, async () => {
        let registrar = await FIFSRegistrar.deployed()
        let result = await registrar.register(labelHash, owner, { from: owner })
        assert.isTrue(result.receipt.status)
        // verify owner
        let registry = await ENSRegistry.deployed()
        let storedOwner = await registry.owner(node)
        assert.strictEqual(storedOwner, owner)
    })

    it('should set public resolver', async () => {
        let registry = await ENSRegistry.deployed()
        let result = await registry.setResolver(node, PublicResolver.address)
        assert.isTrue(result.receipt.status)
        // verify resolver
        let resolver = await registry.resolver(node)
        assert.strictEqual(resolver, PublicResolver.address)
    })

    it("should set IPFS hash", async () =>{
        const type='ipfs'
        const hash='Qm123456789'

        const options = {
            web3: web3,
            ensName: ensName,
            contentType: type,
            contentHash: hash,
            registryAddress: ENSRegistry.address,
            accountIndex: accountIndex,
        }

        const updater = new Updater()
        await updater.update(options)

    })

    it("should replace existing IPFS hash", () =>{
        assert.fail("not yet implemented")
    })
})