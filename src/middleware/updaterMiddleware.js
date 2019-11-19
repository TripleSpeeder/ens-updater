const Updater = require('../../lib/index')

const createUpdater = async ({web3, ensname, controllerAddress, verbose, registryAddress}) => {
    const updater = new Updater()
    const setupOptions = {
        web3: web3,
        ensName: ensname,
        controllerAddress: controllerAddress,
        verbose: verbose,
        registryAddress: registryAddress
    }
    await updater.setup(setupOptions)
    return {updater}
}

module.exports = createUpdater