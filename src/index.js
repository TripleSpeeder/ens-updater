const getCodec = require('content-hash').getCodec
const encode = require('content-hash').encode
const decode = require('content-hash').decode
const ENS = require('ethereum-ens')
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')


module.exports = function Updater() {

    // Local variables
    let encodedHash, account, owner, resolver, ens

    // Preparation: verify input, setup ENS etc.
    async function setup({web3, ensName, contentType, contentHash, registryAddress, accountIndex}) {
        console.log("Verifying content hash...")
        try {
            encodedHash = "0x" + encode(contentType, contentHash)
        } catch(error) {
            console.log("\tCould not encode contenthash: " + error)
            throw error
        }

        ens = new ENS(web3.currentProvider, registryAddress ? registryAddress : undefined)
        const accounts = await web3.eth.getAccounts()
        account = accounts[accountIndex]
        console.log("Verifying ensName owner")
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
            const msg = `\tENS name ${ensName} can not be resolved.`
            console.log(msg)
            throw Error(msg)
        }
    }

    async function runUpdate({dryrun}) {
        // do the actual work
        console.log("Updating contenthash...")
        const currentContentHash = await resolver.contenthash()
        if (currentContentHash) {
            console.log("\tExisting contenthash: " + getCodec(currentContentHash) + ":" + decode(currentContentHash))
        }
        try {
            if (!dryrun) {
                let receipt = await resolver.setContenthash(encodedHash)
                console.log(`\tSuccessfully stored new contentHash. Transaction hash: ${receipt.transactionHash}.`)
            } else {
                console.log(`\tSkipped transaction due to dry-run option being set.`)
            }
        } catch(error) {
            console.log("Error creating transaction: " + error)
            throw error
        }
        // shutdown provider
        console.log("All done, shutting down.")
    }

    return {
        update: async function(options) {
            try{
                await setup(options)
                await runUpdate(options)
            } catch (error) {
                console.error("Error occured. Aborting.")
                process.exit(1)
            }
        }
    };
};
