const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const PublicResolver = artifacts.require("@ensdomains/resolver/PublicResolver");
const namehash = require('eth-ens-namehash');
const Updater = require('../../lib')
const {decode, getCodec} = require('content-hash')
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const accountIndex = 1;
const tld = 'test'
const label = 'wayne'
const ensName = label+'.'+tld
const firstCID = "QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU"
const otherCID = "QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D"
const codec = 'ipfs-ns'
const node = namehash.hash(ensName) // for querying
let updater
let registryAddress

contract("lib - contenthash functions", function(accounts) {
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

    it("should set IPFS hash", async function() {
        await updater.setContenthash({
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
            contentType: codec,
            contentHash: otherCID,
        })

        // verify that updater returns new hash
        const result = await updater.getContenthash()
        assert.strictEqual(result.codec, codec)
        assert.strictEqual(result.hash, otherCID)
    })

    it("should fail with unsupported content codec", async function() {
        assert.isRejected(updater.setContenthash({
            contentType: 'YXZ',
            contentHash: 'someHashValue',
        }))
    })

    it("should set contenthash format CIDv1 CIDs")

})

contract("lib - contenthash functions dry-run", function(accounts) {
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

    it("should not update anything when 'dryrun' option is set", async function() {
        // get current contentHash
        const {codec: prevCodec, hash: prevHash} = await updater.getContenthash()

        // update contentHash with dry-run option set
        await updater.setContenthash({
            contentType: codec,
            contentHash: otherCID,
        })

        // verify that updater still returns old hash
        const result = await updater.getContenthash()
        assert.strictEqual(result.codec, prevCodec)
        assert.strictEqual(result.hash, prevHash)
    })

    it("should fail with unsupported content codec", async function() {
        assert.isRejected(updater.setContenthash({
            contentType: 'YXZ',
            contentHash: 'someHashValue',
        }))
    })

})

contract("lib - contenthash functions estimateGas", function(accounts) {
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
        let gasEstimate = await updater.getContenthash()
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)
    })

    it("should provide gas estimate and not update anything", async function() {
        updater = new Updater()
        await updater.setup(updaterOptions)
        // get current contentHash
        const {codec: prevCodec, has: prevHash} = await updater.getContenthash()

        // update contentHash with estimateGas option set
        updaterOptions.estimateGas = true
        await updater.setup(updaterOptions)
        const gasEstimate = await updater.setContenthash({
            contentType: codec,
            contentHash: otherCID,
        })
        assert.isNumber(gasEstimate)
        assert.isAbove(gasEstimate, 100)

        // verify that updater still returns old hash
        updaterOptions.estimateGas = false
        await updater.setup(updaterOptions)
        const result = await updater.getContenthash()
        assert.strictEqual(result.codec, prevCodec)
        assert.strictEqual(result.hash, prevHash)
    })

})