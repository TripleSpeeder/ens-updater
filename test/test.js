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

contract("", function(accounts) {
    const accountIndex = 0;
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName
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
    let updater

    before(`Register ${ensName} and set default resolver`, async function() {
        // Register domain 'dummy.test'
        let registrar = await FIFSRegistrar.deployed()
        let registerResult = await registrar.register(labelHash, controller, { from: controller })
        assert.isTrue(registerResult.receipt.status)
        // set resolver to public resolver
        let registry = await ENSRegistry.deployed()
        let resolverResult = await registry.setResolver(node, PublicResolver.address)
        assert.isTrue(resolverResult.receipt.status)
    })

    beforeEach('provide fresh updater instance', async function() {
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    it ("should set ETH address record", async function() {
        let newaddress = '0xF6b7788cD280cc1065a16777f7dBD2fE782Be8f9'
        await updater.setAddress({address: newaddress})
        let updatedAddress = await updater.getAddress()
        assert.strictEqual(updatedAddress, newaddress)
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

    it("should set IPFS hash", async function() {
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
        await updater.setContenthash({
            dryrun: false,
            contentType: codec,
            contentHash: otherCID,
        })

        // verify that updater returns new hash
        const result = await updater.getContenthash()
        assert.strictEqual(result.codec, codec)
        assert.strictEqual(result.hash, otherCID)
    })

    it("should not update anything when 'dryrun' option is set", async function() {
        // get current contentHash
        const {codec, hash} = await updater.getContenthash()
        // update contentHash with dry-run option set
        await updater.setContenthash({
            dryrun: true,
            contentType: codec,
            contentHash: firstCID,
        })
        // verify that updater still returns old hash
        const result = await updater.getContenthash()
        assert.strictEqual(result.codec, codec)
        assert.strictEqual(result.hash, hash)
    })

    it("should fail with unsupported content codec", async function() {
        assert.isRejected(updater.setContenthash({
                contentType: 'YXZ',
                contentHash: 'someHashValue',
            }))
    })

    it("should set contenthash format CIDv1 CIDs")

})