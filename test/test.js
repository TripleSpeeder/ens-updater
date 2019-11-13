var assert = require('chai').assert
const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const FIFSRegistrar = artifacts.require("@ensdomains/ens/FIFSRegistrar");
const PublicResolver = artifacts.require("@ensdomains/resolver/PublicResolver");
const namehash = require('eth-ens-namehash');
const utils = require('web3-utils');
const Updater = require('../src/index')
const contenthash = require('content-hash')

contract("", accounts => {
    const accountIndex = 0;
    const owner = accounts[accountIndex] // account that registers and owns ENSName
    const tld = 'test'
    const label = 'dummy'
    const ensName = label+'.'+tld
    const firstCID = "QM12345678901234567890"
    const labelHash = utils.sha3(label) // for registering
    const node = namehash.hash(ensName) // for querying
    const updaterOptions = {
        web3: web3,
        ensName: ensName,
        registryAddress: ENSRegistry.address,
        accountIndex: accountIndex,
        verbose: false,
    }


    it(`should register "${ensName}"`, async function() {
        let registrar = await FIFSRegistrar.deployed()
        let result = await registrar.register(labelHash, owner, { from: owner })
        assert.isTrue(result.receipt.status)
        // verify owner
        let registry = await ENSRegistry.deployed()
        let storedOwner = await registry.owner(node)
        assert.strictEqual(storedOwner, owner)
    })

    it('should set public resolver', async function() {
        let registry = await ENSRegistry.deployed()
        let result = await registry.setResolver(node, PublicResolver.address)
        assert.isTrue(result.receipt.status)
        // verify resolver
        let resolver = await registry.resolver(node)
        assert.strictEqual(resolver, PublicResolver.address)
    })

    it("should set IPFS hash", async function() {
        const updater = new Updater()
        await updater.setup(updaterOptions)
        await updater.setContenthash({
            dryrun: false,
            contentType: 'ipfs',
            contentHash: firstCID,
        })

        // verify that resolver returns correct hash
        const resolver = await PublicResolver.deployed()
        const currentContentHash = await resolver.contenthash(node)
        assert.strictEqual(contenthash.getCodec(currentContentHash), 'ipfs')
        assert.strictEqual(contenthash.decode(currentContentHash), firstCID)
    })

    it("should replace existing IPFS hash", async function() {
        const resolver = await PublicResolver.deployed()

        // get old contentHash
        const oldContentHash = await resolver.contenthash(node)
        assert.strictEqual(contenthash.getCodec(oldContentHash), 'ipfs')
        assert.strictEqual(contenthash.decode(oldContentHash), firstCID)

        // update contentHash
        const otherCID = "QM098765432109876543210987654321"
        const updater = new Updater()
        await updater.setup(updaterOptions)
        await updater.setContenthash({
            dryrun: false,
            contentType: 'ipfs',
            contentHash: otherCID,
        })

        // verify that resolver returns new hash
        const currentContentHash = await resolver.contenthash(node)
        assert.strictEqual(contenthash.getCodec(currentContentHash), 'ipfs')
        assert.strictEqual(contenthash.decode(currentContentHash), otherCID)
    })

    it("should not update anything when 'dryrun' option is set")

    it("should fail with unsupported content codec", async function() {
        const updater = new Updater()
        await updater.setup(updaterOptions)
        assert.throws(updater.setContenthash({
            dryrun: false,
            contentType: 'YXZ',
            contentHash: 'someHashValue',
        }))
    })
})