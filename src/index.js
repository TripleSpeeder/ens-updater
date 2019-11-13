const encode = require('content-hash').encode
const ENS = require('ethereum-ens')
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')


module.exports = function Updater() {

    // module variables
    let encodedHash, account, owner, resolver, ens, verbose

    // Preparation: verify input, setup ENS etc.
    async function doSetup(options) {
        const {web3, ensName, registryAddress, accountIndex} = options
        verbose = options.verbose
        ens = new ENS(web3.currentProvider, registryAddress ? registryAddress : undefined)
        const accounts = await web3.eth.getAccounts()
        account = accounts[accountIndex]
        verbose && console.log("Verifying ensName owner")
        owner = await ens.owner(ensName);
        if (owner !== account) {
            const msg = `\tAccount ${account} is not controller of ${ensName}. Current controller is ${owner}`
            console.error(msg)
            throw Error(msg)
        }

        // Don'use default ABI of ethereum-ens package, as it does not yet support contentHash.
        // See https://github.com/ensdomains/ensjs/issues/37
        resolver = ens.resolver(ensName, ResolverABI.abi)
        try {
            // TODO: check if resolver supports required contentHash interface (https://eips.ethereum.org/EIPS/eip-165)
        } catch(error) {
            const msg = `\tResolver does not support setContentHash interface. You need to upgrade the Resolver.`
            console.error(msg)
            throw Error(msg)
        }
    }


    async function runUpdate({contentType, contentHash, dryrun}) {
        verbose && console.log("Verifying content hash...")
        try {
            encodedHash = "0x" + encode(contentType, contentHash)
        } catch(error) {
            console.error("\tCould not encode contenthash: " + error)
            throw error
        }

        verbose && console.log("Updating contenthash...")
        try {
            if (!dryrun) {
                let receipt = await resolver.setContenthash(encodedHash)
                verbose && console.log(`\tSuccessfully stored new contentHash. Transaction hash: ${receipt.transactionHash}.`)
            } else {
                verbose && console.log(`\tSkipped transaction due to dry-run option being set.`)
            }
        } catch(error) {
            console.error("Error creating transaction: " + error)
            throw error
        }
    }

    return {
        setup: async function(options) {
            try{
                await doSetup(options)
            } catch (error) {
                console.error(`Error occured during setup: ${error}. Aborting.`)
                process.exit(1)
            }
        },
        setContenthash: async function(options) {
            try{
                await runUpdate(options)
            } catch (error) {
                console.error("Error occured during update. Aborting.")
                process.exit(1)
            }
        }
    };
};
