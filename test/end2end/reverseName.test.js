const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {runCommand} = require('./runCommand')
const {wallet} = require('./testdata')

contract('get/set reverse names', function(accounts) {
    const controllerAccountIndex = 1
    const private_key = wallet.private_keys[controllerAccountIndex]
    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    const ensName = 'wayne.test'
    let registryAddress

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    it('should have no reverse name set', async function() {
        const command = `${scriptpath} getReverseName ${accounts[controllerAccountIndex]} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const childResult = await runCommand(command)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /No reverse name record set/)
    })

    it('should estimate gas for setting reverse name', async function() {
        const setReverseNameCmd = `${scriptpath} setReverseName ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress} --estimateGas`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setReverseNameCmd, options)
        assert.isFalse(childResult.failed)
        assert.closeTo(parseInt(childResult.stdout), 125000, 15000)

        // Verify still no reverse name is set
        const getReverseNameCmd = `${scriptpath} getReverseName ${accounts[controllerAccountIndex]} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(getReverseNameCmd)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /No reverse name record set/)
    })

    it('should set reverse name', async function() {
        const setReverseNameCmd = `${scriptpath} setReverseName ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setReverseNameCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/)

        // Verify new reverse name is set
        const getReverseNameCmd = `${scriptpath} getReverseName ${accounts[controllerAccountIndex]} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(getReverseNameCmd)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, ensName)
    })

    it('should estimate gas for clearing reverse name', async function() {
        const clearReverseNameCmd = `${scriptpath} clearReverseName --web3 ${providerstring} --registryAddress ${registryAddress} --estimateGas`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(clearReverseNameCmd, options)
        assert.isFalse(childResult.failed)
        assert.closeTo(parseInt(childResult.stdout), 55000, 8000)
    })

    it('should clear reverse name', async function() {
        const clearReverseNameCmd = `${scriptpath} clearReverseName --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(clearReverseNameCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/)

        const command = `${scriptpath} getReverseName ${accounts[controllerAccountIndex]} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(command)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /No reverse name record set/)
    })

})