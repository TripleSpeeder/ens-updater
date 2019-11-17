const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const FIFSRegistrar = artifacts.require("@ensdomains/ens/FIFSRegistrar");
const PublicResolver = artifacts.require("@ensdomains/resolver/PublicResolver");
const namehash = require('eth-ens-namehash');
const utils = require('web3-utils');
const Updater = require('../lib/index')
const {decode, getCodec} = require('content-hash')
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

contract("", accounts => {
    const accountIndex = 0;
    const controller = accounts[accountIndex] // account that registers and owns ENSName
    const tld = 'test'
    const label = 'dummy'
    const ensName = label+'.'+tld
    const firstCID = "QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU"
    const otherCID = "QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D"
    const codec = 'ipfs-ns'
    const labelHash = utils.sha3(label) // for registering
    const node = namehash.hash(ensName) // for querying
    const updaterOptions = {
        web3: web3,
        ensName: ensName,
        registryAddress: ENSRegistry.address,
        controllerAddress: controller,
        verbose: false,
    }

    it(`should register "${ensName}"`, async function() {
        let registrar = await FIFSRegistrar.deployed()
        let result = await registrar.register(labelHash, controller, { from: controller })
        assert.isTrue(result.receipt.status)
        // verify controller
        let registry = await ENSRegistry.deployed()
        let storedOwner = await registry.owner(node)
        assert.strictEqual(storedOwner, controller)
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
            contentType: codec,
            contentHash: firstCID,
        })

        // verify that resolver returns correct hash
        const resolver = await PublicResolver.deployed()
        const currentContentHash = await resolver.contenthash(node)
        assert.strictEqual(getCodec(currentContentHash), codec)
        assert.strictEqual(decode(currentContentHash), firstCID)
    })

    it("should get correct IPFS hash", async function() {
        const updater = new Updater()
        await updater.setup(updaterOptions)

        // Get content hash directly from resolver
        const resolver = await PublicResolver.deployed()
        const currentContentHash = await resolver.contenthash(node)

        // Get decoded contenthash via updater
        const result = await updater.getContenthash(node)
        assert.strictEqual(result.codec, getCodec(currentContentHash))
        assert.strictEqual(result.hash, decode(currentContentHash))
    })


    it("should replace existing IPFS hash", async function() {
        const resolver = await PublicResolver.deployed()

        // get old contentHash
        const oldContentHash = await resolver.contenthash(node)
        assert.strictEqual(getCodec(oldContentHash), codec)
        assert.strictEqual(decode(oldContentHash), firstCID)

        // update contentHash
        const updater = new Updater()
        await updater.setup(updaterOptions)
        await updater.setContenthash({
            dryrun: false,
            contentType: codec,
            contentHash: otherCID,
        })

        // verify that resolver returns new hash
        const currentContentHash = await resolver.contenthash(node)
        assert.strictEqual(getCodec(currentContentHash), codec)
        assert.strictEqual(decode(currentContentHash), otherCID)
    })

    it("should not update anything when 'dryrun' option is set", async function() {
        const resolver = await PublicResolver.deployed()

        // get old contentHash
        const oldContentHash = await resolver.contenthash(node)

        // update contentHash with dry-run option set
        const updater = new Updater()
        await updater.setup(updaterOptions)
        await updater.setContenthash({
            dryrun: true,
            contentType: codec,
            contentHash: firstCID,
        })

        // verify that resolver still returns old hash
        const currentContentHash = await resolver.contenthash(node)
        assert.strictEqual(currentContentHash, oldContentHash)
    })

    it("should fail with unsupported content codec", async function() {
        const updater = new Updater()
        await updater.setup(updaterOptions)
        assert.isRejected(updater.setContenthash({
                dryrun: false,
                contentType: 'YXZ',
                contentHash: 'someHashValue',
            }))
    })

    it("should set contenthash format CIDv1 CIDs")

})