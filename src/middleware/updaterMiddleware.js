const Updater = require('../../lib/index')

const createUpdater = async ({web3, ensname, controllerAddress, verbose, registryAddress, dryRun}) => {
    const updater = new Updater()
    const setupOptions = {
        web3: web3,
        ensName: ensname,
        controllerAddress: controllerAddress,
        verbose: verbose,
        registryAddress: registryAddress,
        dryrun: dryRun
    }
    await updater.setup(setupOptions)
    return {updater}
}

module.exports = createUpdater