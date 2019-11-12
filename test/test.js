var assert = require('chai').assert
const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const FIFSRegistrar = artifacts.require("@ensdomains/ens/FIFSRegistrar");
const ReverseRegistrar = artifacts.require("@ensdomains/ens/ReverseRegistrar");
const PublicResolver = artifacts.require("@ensdomains/resolver/PublicResolver");
const namehash = require('eth-ens-namehash');
const utils = require('web3-utils');

contract("ipfs", accounts => {
    const owner = accounts[0] // account that registers and owns ENSName
    const resolveAddress = accounts[1] // address the name should resolve to

    // ENS name being tested: "dummy.test"
    const tld = 'test'
    const label = 'dummy'
    const labelHash = utils.sha3(label)
    const nameHash = namehash.hash(label+'.'+tld)

    it(`should register "${label}.${tld}"`, async () => {
        let registrar = await FIFSRegistrar.deployed()
        let result = await registrar.register(labelHash, owner, { from: owner })
        assert.isTrue(result.receipt.status)
        // verify owner
        let registry = await ENSRegistry.deployed()
        let storedOwner = await registry.owner(nameHash)
        assert.strictEqual(storedOwner, owner)
    })

    it("should set IPFS hash", () =>{
        assert.fail("not yet implemented")
    })

    it("should replace IPFS hash", () =>{
        assert.fail("not yet implemented")
    })
})