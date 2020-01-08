const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const FIFSRegistrar = artifacts.require('@ensdomains/ens/FIFSRegistrar')
const PublicResolver = artifacts.require('@ensdomains/resolver/PublicResolver')
const ReverseRegistrar = artifacts.require('@ensdomains/ens/ReverseRegistrar')


const utils = require('web3-utils')
const namehash = require('eth-ens-namehash')

const controllerAccountIndex = 1

module.exports = async function(deployer, network, accounts) {
    // Only run this on development network!
    if (network !== 'development') {
        return
    }

    const registry = await ENSRegistry.deployed()
    const registrar = await FIFSRegistrar.deployed()
    const resolver = await PublicResolver.deployed()
    const reverseRegistrar = await ReverseRegistrar.deployed()

    await setupNames(registry, registrar, resolver, reverseRegistrar, accounts)
}

async function register(label, registrar, owner) {
    const labelHash = utils.sha3(label)
    await registrar.register(labelHash, owner, { from: owner })
    // console.log(`Registered '${label}' owned by ${owner}.`)
}

async function setResolver(ensName, registry, resolverAddress, owner) {
    const node = namehash.hash(ensName)
    await registry.setResolver(node, resolverAddress, {from: owner})
    // console.log(`Set resolver for node ${node} to ${resolverAddress}`)
}

async function setupNames(registry, registrar, resolver, reverseRegistrar, accounts) {
    // console.log('Using registry at ' + registry.address)

    // 'noresolver.eth' has no resolver set
    await register('noresolver', registrar, accounts[controllerAccountIndex])

    // 'wayne.test' has a resolver set, but no name
    await register('wayne', registrar, accounts[controllerAccountIndex])
    await setResolver('wayne.test', registry, resolver.address, accounts[1])

    // 'reverse.test' is registered and resolves to accounts[2]
    // accounts[2] has a full reverse entry pointing back to 'reverse.test'
    await register('reverse', registrar, accounts[2])
    await setResolver('reverse.test', registry, resolver.address, accounts[2])
    await reverseRegistrar.setName('reverse.test', {from: accounts[2]})

    // 'halfreverse.test' is registered and resolves to accounts[3]
    // accounts[3] has a partial reverse setup: Reverse resolver is set, but no name is set in resolver
    let defaultResolver = await reverseRegistrar.defaultResolver()
    await register('halfreverse', registrar, accounts[3])
    await setResolver('halfreverse.test', registry, resolver.address, accounts[3])
    await reverseRegistrar.claimWithResolver(accounts[3], defaultResolver, {from: accounts[3]})
}
