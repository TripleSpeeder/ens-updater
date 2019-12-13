const ENSRegistry = artifacts.require("@ensdomains/ens/ENSRegistry")
const Updater = require('../../lib')
const gasPriceOptions = require('../../src/commands/sharedOptions.json').gasPrice
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const accountIndex = 1;
const tld = 'test'
const label = 'wayne'
const ensName = label+'.'+tld
let updater

contract("lib - gasprice", function(accounts) {
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

    before("Get registry address", async function() {
        const registry = await ENSRegistry.deployed()
        updaterOptions.registryAddress = registry.address
    })

    it ("should use provided gasprice", async function() {
        let gasPriceWei = web3.utils.toBN('52000000000')
        updater = new Updater()
        updaterOptions.gasPrice = gasPriceWei
        await updater.setup(updaterOptions)
        let newaddress = accounts[4]
        const txHash = await updater.setAddress({address: newaddress})
        const transaction = await web3.eth.getTransaction(txHash)
        // Verify the default gasprice was used during transaction
        const txReceipt = await web3.eth.getTransaction(txHash)
        const actualGasprice = web3.utils.toBN(txReceipt.gasPrice)
        assert.isOk(
            actualGasprice.eq(gasPriceWei),
            `Actual ${actualGasprice.toString()} - expected ${gasPriceWei.toString()}`
        )
    })
})
