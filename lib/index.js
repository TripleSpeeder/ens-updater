const {decode, encode, getCodec} = require('content-hash')
const namehash = require('eth-ens-namehash');
const contract = require("@truffle/contract");
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')
const RegistryABI = require('@ensdomains/ens/build/contracts/ENSRegistry.json')
const RegistrarABI = require('../build/contracts/BaseRegistrarImplementation.json');
const RegistryAddresses = require('./ENSAddresses')
const ResolverInterfaces = require('./ResolverInterfaces')


module.exports = function Updater() {

    // module variables
    let resolver, registry, registrar, controllerAddress, verbose, node, web3, ensName

    // validator functions
    async function verifyController() {
        verbose && console.log("Verifying ensName controller")
        const controller = getController()
        if (controller !== controllerAddress) {
            throw Error(`${controllerAddress} is not controller of ${ensName}. Current controller is ${controller}`)
        }
    }

    async function verifyInterface(interfaceName) {
        let EIPSupport = await resolver.supportsInterface(ResolverInterfaces['EIP165'])
        if (!EIPSupport) {
            throw Error(`Resolver contract does not implement EIP165 standard`)
        }
        let support = await resolver.supportsInterface(ResolverInterfaces[interfaceName])
        if (!support) {
            throw Error(`Resolver contract does not implement required interface "${interfaceName}"`)
        }
    }

    async function verifyAddress(address) {
        if (!web3.utils.isAddress(address)) {
            throw Error(`${address} is not a valid Ethereum address`)
        }
    }

    // helper functions
    async function getController() {
        let controller = await registry.owner(node)
        return controller.toLowerCase()
    }

    async function getRegistrant() {
        const labels = ensName.split('.')
        if (labels.length === 2) {
            const keccac256 = web3.utils.soliditySha3(labels[0])
            const registrant = await registrar.ownerOf(keccac256)
            return registrant
        } else {
            return undefined
        }
    }

    async function getExpires() {
        const labels = ensName.split('.')
        if (labels.length === 2) {
            const keccac256 = web3.utils.soliditySha3(labels[0])
            const expires = await registrar.nameExpires(keccac256)
            return expires
        } else {
            return undefined
        }
    }

    async function setup(options) {
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

        // get ENS registrar
        const registrarAddress = await registry.owner(namehash.hash('eth'))
        const registrarContract = contract(RegistrarABI)
        registrarContract.setProvider(web3.currentProvider)
        registrar = await registrarContract.at(registrarAddress)

        // get resolver for node
        const resolverAddress = await registry.resolver(node)
        if (resolverAddress === '0x0000000000000000000000000000000000000000') {
            throw Error(`No resolver set for ${ensName}`)
        }
        const resolverContract = contract(ResolverABI)
        resolverContract.setProvider(web3.currentProvider)
        resolver = await resolverContract.at(resolverAddress)
    }

    async function setAddress({address, dryrun}) {
        await verifyController()
        await verifyInterface('Ethereum Address')
        await verifyAddress(address)
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
                return result.tx
            }
        } catch(error) {
            throw Error(`Error performing setAddr(): ${error}`)
        }
    }

    async function getAddress() {
        await verifyInterface('Ethereum Address')
        verbose && console.log("Getting address...")
        try{
            const address = await resolver.addr(node)
            return address
        }catch(error){
            throw Error(`Error obtaining address: ${error}`)
        }
    }

    async function setContenthash({contentType, contentHash, dryrun}) {
        await verifyInterface('Content Hash')
        await verifyController()

        verbose && console.log("Verifying provided content hash...")
        let encodedHash
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
                return result.tx
            }
        } catch(error) {
            throw Error(`Error performing setContenthash(): ${error}`)
        }
    }

    async function getContenthash() {
        await verifyInterface('Content Hash')
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

    async function listInterfaces() {
        await verifyInterface('EIP165')
        verbose && console.log("Getting supported interfaces...")
        let supportedInterfaces = []
        try {
            for (const interface of Object.keys(ResolverInterfaces)) {
                const support = await resolver.supportsInterface(ResolverInterfaces[interface])
                support && supportedInterfaces.push(interface)
            }
        } catch(error) {
            throw Error(`Error querying interfaces: ${error}`)
        }
        return supportedInterfaces
    }

    async function getInfo() {
        const controller = await getController()
        const registrant = await getRegistrant()
        const expires = await getExpires()

        return {
            Registrant: registrant,
            Controller: controller,
            Resolver: resolver.address,
            Expires: expires,
            Subdomains: [
                'some',
                'subs',
                'here',
            ]
        }
    }

    return {
        setup,
        setContenthash,
        getContenthash,
        setAddress,
        getAddress,
        listInterfaces,
        getInfo
    };
};
