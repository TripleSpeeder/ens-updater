const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {runCommand} = require('./runCommand')
const {wallet} = require('./testdata')


contract('get/set address', function(accounts) {

    const controllerAccountIndex = 1
    const private_key = wallet.private_keys[controllerAccountIndex]
    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    const ensName = 'wayne.test'
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    let registryAddress

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach('Clear address', async function() {
        const clearAddressCmd = `${scriptpath} clearAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        const childResult = await runCommand(clearAddressCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/) // Expected output is a transaction hash so just check for anything starting with '0x'
    })

    after('Clear address', async function() {
        const command = `${scriptpath} clearAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        const childResult = await runCommand(command, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/) // Expected output is a transaction hash so just check for anything starting with '0x'
    })

    it('Should fail when no resolver is set', async function() {
        const command = `${scriptpath} getAddress noresolver.test --web3 ${providerstring} --registryAddress ${registryAddress}`
        const childResult = await runCommand(command)
        assert.isTrue(childResult.failed)
        assert.match(childResult.stderr, /No resolver set/)
    })

    it('Should not fail when no address is set', async function() {
        const command = `${scriptpath} getAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const childResult = await runCommand(command)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, zeroAddress)
    })

    it('Should estimate gas for setting address record', async function() {
        const targetAddress = accounts[3]
        // set new address with estimategas option
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress} --estimateGas`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, '45645')

        // Verify still zero-address is set
        const getAddressCmd = `${scriptpath} getAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(getAddressCmd)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, zeroAddress)
    })

    it('Should set address record', async function() {
        const targetAddress = accounts[3]
        // set new address
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/)

        // Verify new address is set
        const getAddressCmd = `${scriptpath} getAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(getAddressCmd)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, targetAddress)
    })

    it('Should not set address record when dry-run option is set', async function() {
        const targetAddress = accounts[3]
        // set new address with dry-run option
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress} --dry-run`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)

        // Verify still zero-address is set
        const getAddressCmd = `${scriptpath} getAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(getAddressCmd)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, zeroAddress)
    })

    it('Should not clear address record when dry-run option is set', async function() {
        const targetAddress = accounts[4]
        // First set address
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/)

        // clear address with dry-run option
        const clearAddressCmd = `${scriptpath} clearAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress} --dry-run`
        childResult = await runCommand(clearAddressCmd, options)
        assert.isFalse(childResult.failed)

        // Now verify that still previous address is returned
        const getAddressCmd = `${scriptpath} getAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const clearedResult = await runCommand(getAddressCmd)
        assert.isFalse(childResult.failed)
        assert.equal(clearedResult.stdout, targetAddress)
    })

    it('Should clear address record', async function() {
        const targetAddress = accounts[4]
        // First set address
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/)

        // now clear address
        const clearAddressCmd = `${scriptpath} clearAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(clearAddressCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/)

        // Now verify that zero address is returned
        const getAddressCmd = `${scriptpath} getAddress ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const clearedResult = await runCommand(getAddressCmd)
        assert.isFalse(childResult.failed)
        assert.equal(clearedResult.stdout, zeroAddress)
    })
})