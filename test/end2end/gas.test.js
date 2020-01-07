const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {runCommand} = require('./runCommand')
const {private_keys} = require('./testdata').wallet

/* global web3 */

contract('gas option', function(accounts) {

    const controllerAccountIndex = 1
    const private_key = private_keys[controllerAccountIndex]
    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    const ensName = 'wayne.test'
    let registryAddress

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    it('Should use default gas when no option set', async function() {
        let expectedGas = web3.utils.toBN('70000')
        const targetAddress = accounts[3]
        // set address
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        const txHash = childResult.stdout
        assert.match(txHash, /^0x/)
        const transaction = await web3.eth.getTransaction(txHash)
        const actualGas = web3.utils.toBN(transaction.gas)
        // Allow threshhold for slightly changing gas costs
        const threshold = web3.utils.toBN('1000')
        assert.isOk(
            (actualGas.gte(expectedGas.sub(threshold)) && actualGas.lte(expectedGas.add(threshold))),
            `Actual ${actualGas.toString()} - expected ${expectedGas.toString()}`
        )
    })

    it('Should use provided gas amount', async function() {
        let gas = web3.utils.toBN('500005')
        const targetAddress = accounts[3]
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --gas ${gas} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        const txHash = childResult.stdout
        assert.match(txHash, /^0x/)

        // Verify the provided gas was used during transaction
        const transaction = await web3.eth.getTransaction(txHash)
        const actualGas = web3.utils.toBN(transaction.gas)
        assert.isOk(
            actualGas.eq(gas),
            `Actual ${actualGas.toString()} - expected ${gas.toString()}`
        )
    })
})