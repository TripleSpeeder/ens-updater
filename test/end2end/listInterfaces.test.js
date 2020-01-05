const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const chai = require('chai')
const assert = chai.assert
const {runCommand} = require('./runCommand')


contract('listInterfaces', function() {

    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    const ensName = 'wayne.test'
    let registryAddress

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    it('Should return supported interfaces of public resolver', async function() {
        const command = `${scriptpath} listInterfaces ${ensName} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const childResult = await runCommand(command)
        assert.isFalse(childResult.failed)
        const expected = `Resolver supports 8 interfaces:
 - EIP165
 - Ethereum Address
 - Blockchain Address
 - Canonical Name
 - Content Hash
 - Contract ABI
 - Public Key
 - Text Data`
        assert.equal(childResult.stdout, expected)
    })

})