const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry")
const gasPriceOptions = require('../../src/commands/sharedOptions.json').gasPrice
const chai = require("chai")
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)
const assert = chai.assert
const {runCommand} = require('./runCommand')
const {private_keys} = require('./testdata')


contract('gasprice option', function(accounts) {

    const controllerAccountIndex = 1
    const private_key = private_keys[controllerAccountIndex]
    const scriptpath = 'bin/ens-updater.js'
    const providerstring = 'http://localhost:8545'
    const ensName = 'wayne.test'
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    let registryAddress

    before("Get registry address", async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    it("Should use default gasprice when no option set", async function() {
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

        // Verify the default gasprice was used during transaction
        const transaction = await web3.eth.getTransaction(txHash)
        const actualGasprice = web3.utils.toBN(transaction.gasPrice)
        assert.isOk(
            actualGasprice.eq(defaultGaspriceWei),
            `Actual ${actualGasprice.toString()} - expected ${defaultGaspriceWei.toString()}`
        )
    })

    it("Should use provided gasprice", async function() {
        const targetAddress = accounts[3]
        let gasPriceWei = web3.utils.toBN('5000000000')
        let gasPriceGWei = web3.utils.fromWei(gasPriceWei, 'gwei')
        const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} --gasPrice ${gasPriceGWei} --web3 ${providerstring} --registryAddress ${registryAddress}`
        const options = {env: { PRIVATE_KEY: private_key}}
        let childResult = await runCommand(setAddressCmd, options)
        assert.isFalse(childResult.failed)
        const txHash = childResult.stdout
        assert.match(txHash, /^0x/)

        // Verify the provided gasprice was used during transaction
        const transaction = await web3.eth.getTransaction(txHash)
        const actualGasprice = web3.utils.toBN(transaction.gasPrice)
        assert.isOk(
            actualGasprice.eq(gasPriceWei),
            `Actual ${actualGasprice.toString()} - expected ${gasPriceWei.toString()}`
        )
    })
})