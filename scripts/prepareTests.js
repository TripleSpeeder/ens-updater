/*
Test setup:
- TLD 'test'
- Registrations go through FIFSRegistrar
- all use PublicResolver

Register names
'noresolver.test'   -> Registrant: accounts[1], Controller: accounts[2], no resolver
'wayne.test'        -> Registrant: accounts[1], Controller: accounts[2]
'john.wayne.test'   -> Registrant: n/a, Controller: accounts[2]

TODO:
- Register names with previous Resolver versions to enable testing of resolver interface checks
- Registrations through BaseRegistrar
 */

const Web3 = require('web3')
const utils = require('web3-utils');
const contract = require("@truffle/contract");
const namehash = require('eth-ens-namehash');


async function init() {
    const ENV = process.argv[2]
    let provider
    switch (ENV) {
        case 'GANACHE_GUI':
            provider = new Web3.providers.HttpProvider('http://localhost:7545')
            break
        case 'GANACHE_CLI':
        default:
            provider = new Web3.providers.HttpProvider('http://localhost:8545')
            break
    }
    const web3 = new Web3(provider)

    const accounts = await web3.eth.getAccounts()

    // Setup Registry contract
    const registryData = require("../build/contracts/ENSRegistry");
    const registryContract = contract(registryData)
    registryContract.setProvider(web3.currentProvider)
    const registry = await registryContract.deployed()

    // Setup FIFSRegistrar contract
    const registrarData = require("../build/contracts/FIFSRegistrar");
    const registrarContract = contract(registrarData)
    registrarContract.setProvider(web3.currentProvider)
    const registrar = await registrarContract.deployed()

    // Setup PublicResolver contract
    const resolverData = require("../build/contracts/PublicResolver")
    const resolverContract = contract(resolverData)
    resolverContract.setProvider(web3.currentProvider)
    const resolver = await resolverContract.deployed()

    setupNames(registry, registrar, resolver, accounts)

    console.log(`Registry deployed at ${registry.address}`)
}

async function register(label, registrar, owner) {
    const labelHash = utils.sha3(label)
    let registerResult = await registrar.register(labelHash, owner, { from: owner })
    console.log(`Registered '${label}' owned by ${owner}.`)
}

async function setResolver(ensName, registry, resolverAddress, owner) {
    const node = namehash.hash(ensName)
    let resolverResult = await registry.setResolver(node, resolverAddress, {from: owner})
    console.log(`Set resolver for ${node} to ${resolverAddress}`)
}

async function setupNames(registry, registrar, resolver, accounts) {

    await register('noresolver', registrar, accounts[1])
    await register('wayne', registrar, accounts[1])
    await setResolver('wayne.test', registry, resolver.address, accounts[1])
}

init()
