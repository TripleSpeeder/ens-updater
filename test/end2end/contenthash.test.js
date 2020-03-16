const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {runCommand} = require('./runCommand')
const {wallet} = require('./testdata')


contract('get/set contenthash', function() {

    const controllerAccountIndex = 1
    const private_key = wallet.private_keys[controllerAccountIndex]
    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    const ensName = 'wayne.test'
    const firstCID = 'QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU'
    const noRecordResult = 'No contenthash record set'
    let registryAddress

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    beforeEach('Clear contenthash', async function() {
        const clearContenthashCmd = `${scriptpath} clearContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        const childResult = await runCommand(clearContenthashCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/) // Expected output is a transaction hash so just check for anything starting with '0x'
    })

    after('Clear contenthash', async function() {
        const clearContenthashCmd = `${scriptpath} clearContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        const childResult = await runCommand(clearContenthashCmd, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/) // Expected output is a transaction hash so just check for anything starting with '0x'
    })

    it('Should fail when no resolver is set', async function() {
        const command = `${scriptpath} setContenthash noresolver.test ipfs-ns ${firstCID} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        const childResult = await runCommand(command, options)
        assert.isTrue(childResult.failed)
        assert.match(childResult.stderr, /No resolver set/)
    })

    it('Should not fail when no contenthash record is set', async function() {
        const command = `${scriptpath} getContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const childResult = await runCommand(command)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, noRecordResult)
    })

    it('Should estimate gas for setting contenthash record', async function() {
        const command = `${scriptpath} setContenthash ${ensName} ipfs-ns ${firstCID} --web3 ${providerstring} --registryAddress ${registryAddress} --estimateGas`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(command, options)
        assert.isFalse(childResult.failed)
        assert.closeTo(parseInt(childResult.stdout), 92000, 5000)

        // double-check nothing was changed during estimateGas
        const verifyCommand = `${scriptpath} getContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(verifyCommand)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, noRecordResult)
    })

    it('Should estimate gas for clearing contenthash record', async function() {
        const command = `${scriptpath} clearContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress} --estimateGas`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(command, options)
        assert.isFalse(childResult.failed)
        assert.closeTo(parseInt(childResult.stdout), 34000, 5000)
    })

    it('Should set contenthahs record of type ipfs-ns', async function() {
        // set new address
        const contentType = 'ipfs-ns'
        const command = `${scriptpath} setContenthash ${ensName} ${contentType} ${firstCID} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(command, options)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/)

        // Verify new record is set
        const verifyCommand = `${scriptpath} getContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(verifyCommand)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, `${contentType}: ${firstCID}`)
    })

    it('Should not set contenthash record when dry-run option is set', async function() {
        const contentType = 'ipfs-ns'
        const command = `${scriptpath} setContenthash ${ensName} ${contentType} ${firstCID} --web3 ${providerstring} --registryAddress ${registryAddress} --dry-run`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(command, options)
        assert.isFalse(childResult.failed)

        // double-check nothing was changed during dry-run
        const verifyCommand = `${scriptpath} getContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(verifyCommand)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, noRecordResult)
    })

    it('Should not clear contenthash record when dry-run option is set', async function() {
        // First set a record
        const contentType = 'ipfs-ns'
        const command = `${scriptpath} setContenthash ${ensName} ${contentType} ${firstCID} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(command, options)
        assert.isFalse(childResult.failed)

        // clear address with dry-run option
        const clearContenthashCmd = `${scriptpath} clearContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress} --dry-run`
        const clearOptions = {env: { PRIVATE_KEY: private_key}}
        childResult = await runCommand(clearContenthashCmd, clearOptions)
        assert.isFalse(childResult.failed)

        // Now verify that still previous record is returned
        const verifyCommand = `${scriptpath} getContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(verifyCommand)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, `${contentType}: ${firstCID}`)
    })

    it('Should clear contenthash record', async function() {
        // First set record
        const contentType = 'ipfs-ns'
        const command = `${scriptpath} setContenthash ${ensName} ${contentType} ${firstCID} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(command, options)
        assert.isFalse(childResult.failed)

        // now clear record
        const clearContenthashCmd = `${scriptpath} clearContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const clearOptions = {env: { PRIVATE_KEY: private_key}}
        childResult = await runCommand(clearContenthashCmd, clearOptions)
        assert.isFalse(childResult.failed)
        assert.match(childResult.stdout, /^0x/) // Expected output is a transaction hash so just check for anything starting with '0x'

        // Now verify record is cleared
        const verifyCommand = `${scriptpath} getContenthash ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        childResult = await runCommand(verifyCommand)
        assert.isFalse(childResult.failed)
        assert.equal(childResult.stdout, noRecordResult)
    })
})