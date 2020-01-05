const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry')
const {formatsByCoinType} = require('@ensdomains/address-encoder')
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
let updater
let registryAddress

// Testcases taken from EIP 2304 (https://eips.ethereum.org/EIPS/eip-2304)
const coinTests = [
    {
        name: 'Bitcoin',
        cointypeIndex: 0,
        addresses: [
            '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            '3Ai1JZ8pdJb2ksieUV8FsxSNVJCpoPi8W6',
            'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
        ]
    },
    {
        name: 'Litecoin',
        cointypeIndex: 2,
        addresses: [
            'LaMT348PWRnrqeeWArpwQPbuanpXDZGEUz',
            'MQMcJhpWHYVeQArcZR3sBgyPZxxRtnH441',
            'ltc1qdp7p2rpx4a2f80h7a4crvppczgg4egmv5c78w8'
        ]
    },
    {
        name: 'Dogecoin',
        cointypeIndex: 3,
        addresses: [
            'DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD',
            'AF8ekvSf6eiSBRspJjnfzK6d1EM6pnPq3G'
        ]
    },
    {
        name: 'Monacoin',
        cointypeIndex: 22,
        addresses: ['MHxgS2XMXjeJ4if2PRRbWYcdwZPWfdwaDT']
    },
    {
        name: 'Ethereum Classic',
        cointypeIndex: 61,
        addresses: ['0x314159265dD8dbb310642f98f50C066173C1259b']
    },
    {
        name: 'Rootstock',
        cointypeIndex: 137,
        addresses: ['0x5aaEB6053f3e94c9b9a09f33669435E7ef1bEAeD']
    },
    {
        name: 'Ripple',
        cointypeIndex: 144,
        addresses: [
            'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            'X7qvLs7gSnNoKvZzNWUT2e8st17QPY64PPe7zriLNuJszeg'
        ]
    },
    {
        name: 'Bitcoin Cash',
        cointypeIndex: 145,
        addresses: [
            'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
            'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
        ]
    },
    {
        name: 'Binance',
        cointypeIndex: 714,
        addresses: ['bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2']
    }
]

contract('lib - other blockchain address functions', function(accounts) {
    const controller = accounts[accountIndex].toLowerCase() // account that registers and owns ENSName
    const coinTypeETH = 60

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
        // Exclude ether from this test case, as ETH will return 0x0..., while all other coins will return 'null'
        if (coinTypeETH !== coin.coinType) {
            it(`should return null address for ${coin.name} (coinType ${coin.coinType})`, async function () {
                let address = await updater.getAddress(coin.coinType)
                assert.strictEqual(address, null)
            })
        }
    }

    coinTests.forEach(function (coin) {
        coin.addresses.forEach(function(address){
            it(`Should set ${coin.name} address ${address}`, async function() {
                await updater.setAddress({address: address, coinType: coin.cointypeIndex})
                let updatedAddress = await updater.getAddress(coin.cointypeIndex)
                assert.strictEqual(updatedAddress, address)
            })
        })
    })

    coinTests.forEach(function (coin) {
        it(`Should clear ${coin.name} address`, async function() {
            await updater.clearAddress(coin.cointypeIndex)
            let updatedAddress = await updater.getAddress(coin.cointypeIndex)
            assert.strictEqual(updatedAddress, null)
        })
    })
})
