const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry");
const FIFSRegistrar = artifacts.require("@ensdomains/ens/FIFSRegistrar");
const ReverseRegistrar = artifacts.require("@ensdomains/ens/ReverseRegistrar");
const PublicResolver = artifacts.require("@ensdomains/resolver/PublicResolver");

const utils = require('web3-utils');
const namehash = require('eth-ens-namehash');

const controllerAccountIndex = 1

module.exports = async function(deployer, network, accounts) {
    // Only run this on development network!
    if (network !== 'development') {
        return
    }

    const registry = await ENSRegistry.deployed()
    const registrar = await FIFSRegistrar.deployed()
    const resolver = await PublicResolver.deployed()

    setupNames(registry, registrar, resolver, accounts)
}

async function register(label, registrar, owner) {
    const labelHash = utils.sha3(label)
    let registerResult = await registrar.register(labelHash, owner, { from: owner })
    // console.log(`Registered '${label}' owned by ${owner}.`)
}

async function setResolver(ensName, registry, resolverAddress, owner) {
    const node = namehash.hash(ensName)
    let resolverResult = await registry.setResolver(node, resolverAddress, {from: owner})
    // console.log(`Set resolver for ${node} to ${resolverAddress}`)
}

async function setupNames(registry, registrar, resolver, accounts) {
    await register('noresolver', registrar, accounts[controllerAccountIndex])
    await register('wayne', registrar, accounts[controllerAccountIndex])
    await setResolver('wayne.test', registry, resolver.address, accounts[1])
}
