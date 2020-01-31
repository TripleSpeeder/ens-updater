const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const Updater = require('../../lib')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

/* global web3 */

const accountIndex = 1
const tld = 'test'
const label = 'wayne'
const ensName = label+'.'+tld
const coinTypeETH = 60
let updater

contract('lib - gas', function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName

    let updaterOptions = {
        web3: web3,
        ensName: ensName,
        registryAddress: undefined,
        controllerAddress: controller,
        verbose: false,
        dryrun: false,
        estimateGas: false,
    }

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        updaterOptions.registryAddress = registry.address
    })

    it ('should use automatic gas amount calculation when not specified', async function() {
        let expectedGas = web3.utils.toBN('70000')
        updater = new Updater()
        await updater.setup(updaterOptions)
        let newaddress = accounts[4]
        const txHash = await updater.setAddress({
            address: newaddress,
            coinType: coinTypeETH
        })
        const txReceipt = await web3.eth.getTransaction(txHash)
        const actualGas = web3.utils.toBN(txReceipt.gas)
        // Allow threshhold for slightly changing gas costs
        let threshold = web3.utils.toBN('1000')
        assert.isOk(
            (actualGas.gte(expectedGas.sub(threshold)) && actualGas.lte(expectedGas.add(threshold))),
            `Actual ${actualGas.toString()} - expected ${expectedGas.toString()}`
        )
    })

    it ('should use provided gas amount', async function() {
        let gas = web3.utils.toBN('500005')
        updater = new Updater()
        updaterOptions.gas = gas
        await updater.setup(updaterOptions)
        let newaddress = accounts[4]
        const txHash = await updater.setAddress({
            address: newaddress,
            coinType: coinTypeETH
        })
        const txReceipt = await web3.eth.getTransaction(txHash)
        const actualGas = web3.utils.toBN(txReceipt.gas)
        assert.isOk(
            actualGas.eq(gas),
            `Actual ${actualGas.toString()} - expected ${gas.toString()}`
        )
    })
})
