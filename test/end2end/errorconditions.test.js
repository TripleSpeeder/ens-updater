const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {private_keys, mnemonic} = require('./testdata').wallet
const {runCommand} = require('./runCommand')


contract('errorConditions', function(accounts) {

    const controllerAccountIndex = 1
    const private_key = private_keys[controllerAccountIndex]
    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    let registryAddress

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    it('Should show usage info when no commands are specified', function() {
        const childResult = runCommand(scriptpath)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /Usage: ens-updater.js <command> \[options]/)
    })

    it('Should show error message when web3 connectionstring is invalid and no account required', function() {
        const command = `${scriptpath} getContenthash wayne.test --web3 http://in.val.id:12345`
        const childResult = runCommand(command)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /Node is not reachable at/)
    })

    it('Should show error message when web3 connectionstring is invalid and account is required', function() {
        const command = `${scriptpath} setAddress wayne.test 0x123 --web3 http://in.valid:12345`
        const options = {
            env: { PRIVATE_KEY: private_key }
        }
        const childResult = runCommand(command, options)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /Node is not reachable at/)
    })

    it('Should show error message when account is required but no credentials are provided', async function() {
        const targetAddress = accounts[3]
        const command = `${scriptpath} setAddress wayne.test ${targetAddress} --web3 ${providerstring}`
        const childResult = runCommand(command)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /Got neither mnemonic nor private key/)
    })

    it('Should show error message when account is required and both mnemonic and private key are provided', async function() {
        const targetAddress = accounts[3]
        const command = `${scriptpath} setAddress wayne.test ${targetAddress} --web3 ${providerstring}`
        const options = {
            env: {
                MNEMONIC: mnemonic,
                PRIVATE_KEY: private_key
            }
        }
        const childResult = runCommand(command, options)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /Got both mnemonic and private key/)
    })

    it('Should show error message when provided account is not controller of ensname', async function() {
        const targetAddress = accounts[3]
        const other_private_key = private_keys[3]
        const command = `${scriptpath} setAddress wayne.test ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {
            env: { PRIVATE_KEY: other_private_key }
        }
        const childResult = runCommand(command, options)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /is not controller of wayne.test./)
    })

    it('Should show error message when resolver is required but not set', async function() {
        const targetAddress = accounts[3]
        const command = `${scriptpath} setAddress noresolver.test ${targetAddress} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {
            env: { PRIVATE_KEY: private_key }
        }
        const childResult = runCommand(command, options)
        assert.isTrue(childResult.failed, 'Command should have failed')
        assert.match(childResult.stderr, /No resolver set for /)
    })
})