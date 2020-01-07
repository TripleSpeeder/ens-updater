const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const {formatsByCoinType} = require('@ensdomains/address-encoder')
const Updater = require('../../lib')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {blockchainAddressTestcases} = require('../end2end/testdata')

/* global web3 */

const accountIndex = 1
const tld = 'test'
const label = 'wayne'
const ensName = label+'.'+tld
let updater
let registryAddress

contract('lib - other blockchain address functions', function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName
    const zeroAddress = '0x0000000000000000000000000000000000000000'

    before('Get registry address', async function() {
        const registry = await ENSRegistry.deployed()
        registryAddress = registry.address
    })

    before('provide fresh updater instance', async function() {
        const updaterOptions = {
            web3: web3,
            ensName: ensName,
            registryAddress: registryAddress,
            controllerAddress: controller,
            verbose: false,
            dryrun: false,
            gasPrice: web3.utils.toBN('10000000000')
        }
        updater = new Updater()
        await updater.setup(updaterOptions)
    })

    for (let coin of Object.values(formatsByCoinType)) {
        it(`should return zero address for ${coin.name} (coinType ${coin.coinType})`, async function () {
            let address = await updater.getAddress(coin.coinType)
            assert.strictEqual(address, zeroAddress)
        })
    }

    blockchainAddressTestcases.forEach(function (coin) {
        coin.addresses.forEach(function(address){
            it(`Should set ${coin.name} address ${address}`, async function() {
                await updater.setAddress({address: address, coinType: coin.cointypeIndex})
                let updatedAddress = await updater.getAddress(coin.cointypeIndex)
                assert.strictEqual(updatedAddress, address)
            })
        })
    })

    blockchainAddressTestcases.forEach(function (coin) {
        it(`Should clear ${coin.name} address`, async function() {
            await updater.clearAddress(coin.cointypeIndex)
            let updatedAddress = await updater.getAddress(coin.cointypeIndex)
            assert.strictEqual(updatedAddress, zeroAddress)
        })
    })
})
