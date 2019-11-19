const {decode, encode, getCodec} = require('content-hash')
const namehash = require('eth-ens-namehash');
const contract = require("@truffle/contract");
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')
const RegistryABI = require('@ensdomains/ens/build/contracts/ENSRegistry.json')
const RegistryAddresses = require('./ENSAddresses')


module.exports = function Updater() {

    // module variables
    let encodedHash, controllerAddress, resolver, registry, verbose, node, web3, ensName

    // Preparation: verify input, setup web3 and ens contracts etc.
    async function doSetup(options) {
        let {registryAddress} =  options
        verbose = options.verbose
        controllerAddress = options.controllerAddress
        ensName = options.ensName
        web3 = options.web3
        node = namehash.hash(ensName)

        if (registryAddress === undefined) {
            // use default address based on network ID
            const netID = await web3.eth.net.getId()
            registryAddress = RegistryAddresses[netID]
            if (registryAddress === undefined) {
                throw Error(`Unknown networkID ${netID} - Please provide address of the ENS Registry (use option '--registryaddress')`)
            }
        }

        // get ENS registry
        const registryContract = contract(RegistryABI)
        registryContract.setProvider(web3.currentProvider)
        registry = await registryContract.at(registryAddress)
        // get resolver for node
        const resolverAddress = await registry.resolver(node)
        if (resolverAddress === '0x0000000000000000000000000000000000000000') {
            throw Error(`No resolver set for ${ensName}`)
        }
        const resolverContract = contract(ResolverABI)
        resolverContract.setProvider(web3.currentProvider)
        resolver = await resolverContract.at(resolverAddress)

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

    async function verifyController() {
        verbose && console.log("Verifying ensName controller")
        let owner = await registry.owner(node)
        const owner_lower = owner.toLowerCase()
        if (owner_lower !== controllerAddress) {
            throw Error(`${controllerAddress} is not controller of ${ensName}. Current controller is ${owner}`)
        }
    }

    async function doSetAddress({address, dryrun}) {
        await verifyController()
        verbose && console.log("Verifying ethereum address")
        if (!web3.utils.isAddress(address)) {
            throw Error(`${address} is not a valid Ethereum address`)
        }
        verbose && console.log("Updating address...")
        try {
            if (dryrun) {
                // just call() contract method
                let result = await resolver.setAddr.call(node, address, {from: controllerAddress})
                verbose && console.log(`\tDry-run successful. Calling setAddr did not yield any error.`)
            } else {
                // the real deal
                let result = await resolver.setAddr(node, address, {from: controllerAddress})
                verbose && console.log(`\tSuccessfully stored new address. Transaction hash: ${result.tx}.`)
            }
        } catch(error) {
            throw Error(`Error performing setAddr(): ${error}`)
        }
    }

    async function doGetAddress() {
        verbose && console.log("Getting address...")
        try{
            const address = await resolver.addr(node)
            return address
        }catch(error){
            throw Error(`Error obtaining address: ${error}`)
        }
    }


    async function doSetContenthash({contentType, contentHash, dryrun}) {
        await verifyController()
        verbose && console.log("Verifying provided content hash...")
        try {
            encodedHash = "0x" + encode(contentType, contentHash)
        } catch(error) {
            throw Error(`\tCould not encode contenthash: ${error}`)
        }

        verbose && console.log("Updating contenthash...")
        try {
            if (dryrun) {
                // just call() contract method
                let result = await resolver.setContenthash.call(node, encodedHash, {from: controllerAddress})
                verbose && console.log(`\tDry-run successful. Calling setContenthash did not yield any error.`)
            } else {
                // the real deal
                let result = await resolver.setContenthash(node, encodedHash, {from: controllerAddress})
                verbose && console.log(`\tSuccessfully stored new contentHash. Transaction hash: ${result.tx}.`)
            }
        } catch(error) {
            throw Error(`Error performing setContenthash(): ${error}`)
        }
    }

    async function doGetContenthash() {
        verbose && console.log("Getting content...")
        try{
            const currentContenthash = await resolver.contenthash(node)
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

    return {
        setup: async function(options) {
            return doSetup(options)
        },
        setContenthash: async function(options) {
            return doSetContenthash(options)
        },
        getContenthash: async function() {
            return doGetContenthash()
        },
        setAddress: async function(options) {
            return doSetAddress(options)
        },
        getAddress: async function() {
            return doGetAddress()
        }
    };
};
