const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistryWithFallback')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const {runCommand} = require('./runCommand')
const {wallet, blockchainAddressTestcases} = require('./testdata')

/* global web3 */

contract('get/set other blockchain address', function() {

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

    /* Tests that do not change state */
    it('Should fail with unknown coin symbol', async function() {
        const wrongSymbol = 'NOCOIN'
        const command = `${scriptpath} getAddress ${ensName} ${wrongSymbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
        // Force language en_US to get error message in English
        const options = {env: {LANG: 'en_US.UTF-8'}}
        const childResult = await runCommand(command, options)
        assert.isTrue(childResult.failed)
        assert.match(childResult.stderr, /Invalid values/)
    })

    for (let coin of blockchainAddressTestcases) {
        it(`Should fail trying to get ${coin.name} address when no resolver is set`, async function() {
            const command = `${scriptpath} getAddress noresolver.test ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
            const childResult = await runCommand(command)
            assert.isTrue(childResult.failed)
            assert.match(childResult.stderr, /No resolver set/)
        })

        it(`Should not fail trying to get unset ${coin.name} address`, async function() {
            const command = `${scriptpath} getAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
            const childResult = await runCommand(command)
            assert.isFalse(childResult.failed)
            assert.strictEqual(childResult.stdout, zeroAddress)
        })

        it(`Should estimate gas for setting ${coin.name} address record`, async function() {
            const targetAddress = coin.addresses[0]
            // set new address with estimategas option
            const setAddressCmd = `${scriptpath} setAddress ${ensName} ${targetAddress} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress} --estimateGas`
            const options = {env: { PRIVATE_KEY: private_key}}
            let childResult = await runCommand(setAddressCmd, options)
            assert.isFalse(childResult.failed)
            const actualGas = web3.utils.toBN(childResult.stdout)
            const expectedGas = web3.utils.toBN('55000')
            const threshold = web3.utils.toBN('5000')
            assert.isOk(
                (actualGas.gte(expectedGas.sub(threshold)) && actualGas.lte(expectedGas.add(threshold))),
                `Actual ${actualGas.toString()} - expected ${expectedGas.toString()}`
            )

            // Verify still zero-address is set
            const getAddressCmd = `${scriptpath} getAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
            childResult = await runCommand(getAddressCmd)
            assert.isFalse(childResult.failed)
            assert.strictEqual(childResult.stdout, zeroAddress)
        })

        it(`Should not set ${coin.name} address record ${coin.addresses[0]} when dry-run option is set`, async function () {
            // set new address with dry-run option
            const setAddressCmd = `${scriptpath} setAddress ${ensName} ${coin.addresses[0]} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress} --dry-run`
            const options = {env: {PRIVATE_KEY: private_key}}
            let childResult = await runCommand(setAddressCmd, options)
            assert.isFalse(childResult.failed)

            // Verify still zero-address is set
            const getAddressCmd = `${scriptpath} getAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
            childResult = await runCommand(getAddressCmd)
            assert.isFalse(childResult.failed)
            assert.strictEqual(childResult.stdout, zeroAddress)
        })
    }

    /* Setting address records */
    for (let coin of blockchainAddressTestcases) {
        for (let address of coin.addresses) {
            it(`Should set ${coin.name} address record ${address}`, async function () {
                // set new address
                const setAddressCmd = `${scriptpath} setAddress ${ensName} ${address} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
                const options = {env: {PRIVATE_KEY: private_key}}
                let childResult = await runCommand(setAddressCmd, options)
                assert.isFalse(childResult.failed)
                assert.match(childResult.stdout, /^0x/)

                // Verify new address is set
                const getAddressCmd = `${scriptpath} getAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
                childResult = await runCommand(getAddressCmd)
                assert.isFalse(childResult.failed)
                assert.strictEqual(childResult.stdout, address)
            })
        }
    }

    /* Clearing address records */
    for (let coin of blockchainAddressTestcases) {
        it(`Should not clear ${coin.name} address record when dry-run option is set`, async function() {
            // get current address
            const getAddressCmd = `${scriptpath} getAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
            let childResult = await runCommand(getAddressCmd)
            // console.log(childResult)
            assert.isFalse(childResult.failed)
            // test only makes sense if some address has been set before!
            assert.notStrictEqual(childResult.stdout, zeroAddress)
            const prevAddress = childResult.stdout

            // clear address with dry-run option
            const clearAddressCmd = `${scriptpath} clearAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress} --dry-run`
            const options = {env: {PRIVATE_KEY: private_key}}
            childResult = await runCommand(clearAddressCmd, options)
            assert.isFalse(childResult.failed)

            // verify that still previous address is returned
            const clearedResult = await runCommand(getAddressCmd)
            assert.isFalse(childResult.failed)
            assert.strictEqual(clearedResult.stdout, prevAddress)
        })

        it(`Should clear ${coin.name} address record`, async function() {
            const clearAddressCmd = `${scriptpath} clearAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
            const options = {env: {PRIVATE_KEY: private_key}}
            let childResult = await runCommand(clearAddressCmd, options)
            assert.isFalse(childResult.failed)
            assert.match(childResult.stdout, /^0x/)

            // Now verify that zero address is returned
            const getAddressCmd = `${scriptpath} getAddress ${ensName} ${coin.symbol} --web3 ${providerstring} --registryAddress ${registryAddress}`
            const clearedResult = await runCommand(getAddressCmd)
            assert.isFalse(childResult.failed)
            assert.strictEqual(clearedResult.stdout, zeroAddress)
        })
    }
})