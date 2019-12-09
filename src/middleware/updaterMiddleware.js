const Updater = require('../../lib/index')

const createUpdater = async ({web3, ensname, controllerAddress, verbose, registryAddress, dryRun, requiresAccount, estimateGas}) => {
    const updater = new Updater()

    // Ignore 'dryRun' option for read-only commands
    // TODO: Prevent setting both options via yargs configuration?
    if (!requiresAccount) {
        dryRun = false
    }

    const setupOptions = {
        web3: web3,
        ensName: ensname,
        controllerAddress: controllerAddress,
        verbose: verbose,
        registryAddress: registryAddress,
        dryrun: dryRun,
        estimateGas: estimateGas
    }
    await updater.setup(setupOptions)
    return {updater}
}

module.exports = createUpdater