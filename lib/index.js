const {decode, encode, getCodec} = require('content-hash')
const namehash = require('eth-ens-namehash');
const contract = require("@truffle/contract");
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')
const RegistryABI = require('@ensdomains/ens/build/contracts/ENSRegistry.json')
const RegistryAddresses = require('./ENSAddresses')


module.exports = function Updater() {

    // module variables
    let encodedHash, account, owner, resolver, registry, verbose, node

    // Preparation: verify input, setup web3 and ens contracts etc.
    async function doSetup(options) {
        const {web3, ensName, accountIndex} = options
        let {verbose, registryAddress} =  options

        node = namehash.hash(ensName)

        if (registryAddress === undefined) {
            // use default address based on network ID
            const netID = await web3.eth.net.getId()
            registryAddress = RegistryAddresses[netID]
            if (registryAddress === undefined) {
                throw Error(`Unknown networkID ${netID} - Please provide address of the ENS Registry (use option '--registryaddress')`)
            }
        }


        const accounts = await web3.eth.getAccounts()
        account = accounts[accountIndex]

        // prepare contract instances
        const registryContract = contract(RegistryABI)
        registryContract.setProvider(web3.currentProvider)
        const resolverContract = contract(ResolverABI)
        resolverContract.setProvider(web3.currentProvider)
        registry = await registryContract.at(registryAddress)
        const resolverAddress = await registry.resolver(node)
        resolver = await resolverContract.at(resolverAddress)

        verbose && console.log("Verifying ensName owner")
        owner = await registry.owner(node)
        if (owner !== account) {
            throw Error(`\tAccount ${account} is not controller of ${ensName}. Current controller is ${owner}`)
        }

        /*
        // TODO: check if resolver supports required contentHash interface (https://eips.ethereum.org/EIPS/eip-165)
        verbose && console.log("Verifying contenthash support of resolver")
        try {
            // checks here...
        } catch(error) {
            throw Error(`\tResolver does not support setContentHash interface. You need to upgrade the Resolver.`)
        }
        */
    }

    async function doSetContenthash({contentType, contentHash, dryrun}) {
        verbose && console.log("Verifying content hash...")
        try {
            encodedHash = "0x" + encode(contentType, contentHash)
        } catch(error) {
            throw Error(`\tCould not encode contenthash: ${error}`)
        }

        verbose && console.log("Updating contenthash...")
        try {
            if (!dryrun) {
                let result = await resolver.setContenthash(node, encodedHash, {from: account})
                verbose && console.log(`\tSuccessfully stored new contentHash. Transaction hash: ${result.tx}.`)
            } else {
                verbose && console.log(`\tSkipped transaction due to dry-run option being set.`)
            }
        } catch(error) {
            throw Error(`Error performing setContenthash(): ${error}`)
        }
    }

    /*
    async function doGetContenthash() {
        verbose && console.log("Getting content...")
        try{
            const currentContenthash = await resolver.contenthash()
            const codec = getCodec(currentContenthash)
            const hash = decode(currentContenthash)
            return {
                codec,
                hash
            }
        }catch(error){
            throw Error(`Error obtaining contenthash: ${error}`)
        }
    }
    */

    return {
        setup: async function(options) {
            return doSetup(options)
        },
        setContenthash: async function(options) {
            return doSetContenthash(options)
        }/*,
        getContenthash: async function() {
            return doGetContenthash()
        }*/
    };
};
