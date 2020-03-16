const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const gasPriceOptions = require('../../src/commands/sharedOptions.json').gasPrice
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {runCommand} = require('./runCommand')
const {private_keys} = require('./testdata').wallet

/* global web3 */

contract('gasPrice option', function(accounts) {

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

    it('Should use default gasPrice when no option set', async function() {
        const defaultGaspriceGWei = web3.utils.toBN(gasPriceOptions.default)
        const defaultGaspriceWei = web3.utils.toWei(defaultGaspriceGWei, 'gwei')
        const targetAddress = accounts[3]
        // set address
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        const txHash = childResult.stdout
        assert.match(txHash, /^0x/)

        // Verify the default gasPrice was used during transaction
        const transaction = await web3.eth.getTransaction(txHash)
        const actualGasprice = web3.utils.toBN(transaction.gasPrice)
        assert.isOk(
            actualGasprice.eq(defaultGaspriceWei),
            `Actual ${actualGasprice.toString()} - expected ${defaultGaspriceWei.toString()}`
        )
    })

    it('Should use provided gasPrice', async function() {
        const targetAddress = accounts[3]
        let gasPriceWei = web3.utils.toBN('5000000000')
        let gasPriceGWei = web3.utils.fromWei(gasPriceWei, 'gwei')
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --gasPrice ${gasPriceGWei} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        const txHash = childResult.stdout
        assert.match(txHash, /^0x/)

        // Verify the provided gasPrice was used during transaction
        const transaction = await web3.eth.getTransaction(txHash)
        const actualGasprice = web3.utils.toBN(transaction.gasPrice)
        assert.isOk(
            actualGasprice.eq(gasPriceWei),
            `Actual ${actualGasprice.toString()} - expected ${gasPriceWei.toString()}`
        )
    })

    it('Should show error message when gasPrice is too high', async function() {
        // The internal limit is set to 500 gwei. Anything above this value will be considered user error and rejected.
        const targetAddress = accounts[3]
        let gasPriceWei = web3.utils.toBN('501000000000')
        let gasPriceGWei = web3.utils.fromWei(gasPriceWei, 'gwei')
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --gasPrice ${gasPriceGWei} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /Gas price too high/)
    })

    it('Should display gas price info in verbose mode', async function() {
        const targetAddress = accounts[3]
        let gasPriceWei = web3.utils.toBN('5000000000')
        let gasPriceGWei = web3.utils.fromWei(gasPriceWei, 'gwei')
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --verbose --gasPrice ${gasPriceGWei} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, new RegExp(`Setting gas price: ${gasPriceGWei.toString()} gwei`))
    })

    it('Should not display gas price info in verbose mode for read-only commands', async function() {
        let gasPriceWei = web3.utils.toBN('5000000000')
        let gasPriceGWei = web3.utils.fromWei(gasPriceWei, 'gwei')
        const getAddressCmd = `${scriptpath} getAddress ${ensName} --verbose --gasPrice ${gasPriceGWei} --web3 ${providerstring} --registryAddress ${registryAddress}`
        let childResult = await runCommand(getAddressCmd)
        assert.isFalse(childResult.failed, 'Command should not fail')
        assert.notMatch(childResult.stdout, /Setting gas price:/)
    })
})