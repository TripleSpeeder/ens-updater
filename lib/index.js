const {decode, encode, getCodec} = require('content-hash')
const namehash = require('eth-ens-namehash')
const contract = require('@truffle/contract')
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')
const RegistryABI = require('@ensdomains/ens/build/contracts/ENSRegistry.json')
const RegistrarABI = require('@ensdomains/ethregistrar/build/contracts/BaseRegistrarImplementation.json')
const RegistryAddresses = require('./ENSAddresses')
const ResolverInterfaces = require('./ResolverInterfaces')


module.exports = function Updater() {

    // module variables
    let resolver, registry, registrar, controllerAddress, verbose, node, web3, ensName, dryrun, estimateGas, gasPrice
    const zeroAddress = '0x0000000000000000000000000000000000000000'

    // validator functions
    async function verifyResolver() {
        if (!resolver) {
            throw Error(`No resolver set for ${ensName}`)
        }
    }

    async function verifyController() {
        verbose && console.log('Verifying ensName controller')
        const controller = await getController()
        if (controller !== controllerAddress) {
            throw Error(`${controllerAddress} is not controller of ${ensName}. Current controller is ${controller}`)
        }
    }

    async function verifyInterface(interfaceName) {
        let EIPSupport = await resolver.supportsInterface(ResolverInterfaces['EIP165'])
        if (!EIPSupport) {
            throw Error('Resolver contract does not implement EIP165 standard')
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
    function getTLD(ensName) {
        return ensName.split('.').pop()
    }

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
        dryrun = options.dryrun
        estimateGas = options.estimateGas
        verbose = options.verbose
        controllerAddress = options.controllerAddress
        ensName = options.ensName
        web3 = options.web3
        gasPrice = options.gasPrice

        node = namehash.hash(ensName)

        // unset dry-run option when estimateGas is set
        if (estimateGas) {
            dryrun = false
        }

        let registryAddress = options.registryAddress

        if (registryAddress === undefined) {
            // use default address based on network ID
            const netID = await web3.eth.net.getId()
            registryAddress = RegistryAddresses[netID]
            if (registryAddress === undefined) {
                throw Error(`Unknown networkID ${netID} - Please provide address of the ENS Registry (use option '--registryAddress')`)
            }
        }

        // get ENS registry
        const registryContract = contract(RegistryABI)
        registryContract.setProvider(web3.currentProvider)
        registry = await registryContract.at(registryAddress)

        // get ENS registrar
        // TODO: I'm assuming that the registrar is the permanent registrar. Should explicitly check the type or registrar
        // and use the matching contract ABI!
        const registrarAddress = await registry.owner(namehash.hash(getTLD(ensName)))
        const registrarContract = contract(RegistrarABI)
        registrarContract.setProvider(web3.currentProvider)
        registrar = await registrarContract.at(registrarAddress)

        // get resolver if it it set
        const resolverAddress = await registry.resolver(node)
        if (resolverAddress !== '0x0000000000000000000000000000000000000000') {
            const resolverContract = contract(ResolverABI)
            resolverContract.setProvider(web3.currentProvider)
            resolver = await resolverContract.at(resolverAddress)
        }
    }

    async function stop() {
        // Perform a clean shutdown. Especially needed for HDWalletProvider engine to prevent dangling process
        if (web3 && web3.currentProvider && web3.currentProvider.engine && web3.currentProvider.engine.stop) {
            verbose && console.log('Stopping provider engine')
            await web3.currentProvider.engine.stop()
        }
        if(web3 && web3.currentProvider && web3.currentProvider.connection && web3.currentProvider.connection.close){
            verbose && console.log('Closing provider connection')
            await web3.currentProvider.connection.close()
        }
    }

    function isMethodConstant(contract, method) {
        // check ABI if this is a constant function
        // Find the first method that matches the name. There might be overloaded variants, but they will
        // all have the same mutability, so just take first entry with [0]
        let abi = contract.abi.filter(entry => (entry.name === method))[0]
        return abi.constant
    }

    async function execute(contract, method, ...args) {
        let resultType
        let doDryrun = dryrun
        let func = contract[method]

        if(isMethodConstant(contract, method)) {
            // ignore dry-run option for constant methods
            doDryrun = false
            // constant methods directly return the desired result, not a transaction object
            resultType = 'direct'
        } else {
            // Add transaction options for non-constant methods
            const transactionOptions = {
                // Add additional options like gas parameters etc. here
                from: controllerAddress,
                gasPrice: gasPrice,
            }
            args.push(transactionOptions)
            resultType = 'transaction' // Desired result is a transaction hash. Will return result.tx
        }

        if (estimateGas) {
            func = func['estimateGas']
            resultType = 'direct'
        }
        if (doDryrun) {
            func = func['call']
            resultType = 'none' // dry-run will not return any meaningful result
        }

        // Interact with contract and return result
        const result = await func(...args)
        switch (resultType) {
            case 'direct':
                return result
            case 'none':
                return undefined
            case 'transaction':
                return result.tx
            default:
                throw Error('Unknown resulttype')
        }
    }

    async function setAddress({address}) {
        await verifyResolver()
        await verifyController()
        await verifyInterface('Ethereum Address')
        await verifyAddress(address)
        verbose && console.log('Updating address...')
        try {
            let result = await execute(resolver, 'setAddr', node, address)
            return result
        } catch(error) {
            throw Error(`Error performing setAddr(): ${error}`)
        }
    }

    async function clearAddress() {
        await verifyResolver()
        await verifyController()
        await verifyInterface('Ethereum Address')
        verbose && console.log('Clearing address')
        try {
            let result = await execute(resolver, 'setAddr', node, zeroAddress)
            return result
        } catch(error) {
            throw Error(`Error clearing address: ${error}`)
        }
    }

    async function getAddress() {
        await verifyResolver()
        await verifyInterface('Ethereum Address')
        verbose && console.log('Getting address...')
        try{
            const result = await execute(resolver, 'addr', node)
            return result
        }catch(error){
            throw Error(`Error obtaining address: ${error}`)
        }
    }

    async function setContenthash({contentType, contentHash}) {
        await verifyResolver()
        await verifyInterface('Content Hash')
        await verifyController()

        verbose && console.log('Verifying provided content hash...')
        let encodedHash
        try {
            encodedHash = '0x' + encode(contentType, contentHash)
        } catch(error) {
            throw Error(`\tError encoding ${contentType} - ${contentHash}: ${error}`)
        }

        verbose && console.log('Updating contenthash...')
        try {
            let result = await execute(resolver, 'setContenthash', node, encodedHash)
            return result
        } catch(error) {
            throw Error(`Error performing setContenthash(): ${error}`)
        }
    }

    async function clearContenthash() {
        await verifyResolver()
        await verifyInterface('Content Hash')
        await verifyController()

        verbose && console.log('Clearing contenthash record...')
        try {
            let result = await execute(resolver, 'setContenthash', node, [])
            return result
        } catch(error) {
            throw Error(`Error performing clearContenthash(): ${error}`)
        }
    }

    async function getContenthash() {
        await verifyResolver()
        await verifyInterface('Content Hash')
        verbose && console.log('Getting content...')
        try {
            const result = await execute(resolver, 'contenthash', node)
            if ((result === null) || (result === undefined)) {
                return {
                    codec: undefined,
                    hash: undefined
                }
            } else if (estimateGas) {
                // result should be gas value
                return result
            } else {
                // result should be a real contenthash value. Decode it and return as plaintext
                try {
                    const codec = getCodec(result)
                    const hash = decode(result)
                    return {
                        codec,
                        hash
                    }
                } catch (decodingError) {
                    throw Error(`Error decoding contenthash "${result}": ${decodingError}`)
                }
            }
        } catch (error) {
            throw Error(`Error getting contenthash: ${error}`)
        }
    }

    async function listInterfaces() {
        await verifyResolver()
        await verifyInterface('EIP165')
        verbose && console.log('Getting supported interfaces...')
        let supportedInterfaces = []
        try {
            for (const interfaceName of Object.keys(ResolverInterfaces)) {
                const support = await execute(resolver, 'supportsInterface', ResolverInterfaces[interfaceName])
                support && supportedInterfaces.push(interfaceName)
            }
        } catch(error) {
            throw Error(`Error querying interfaces: ${error}`)
        }
        return supportedInterfaces
    }

    async function getInfo() {
        const controller = await getController()
        let registrant = await getRegistrant()
        let expires = await getExpires()
        let address = await getAddress()
        return {
            Registrant: registrant ? registrant : 'n/a',
            Controller: controller,
            Resolver: resolver ? resolver.address: zeroAddress,
            Expires: expires ? new Date(expires*1000) : 'n/a',
            Address: address
        }
    }

    return {
        setup,
        stop,
        setContenthash,
        getContenthash,
        clearContenthash,
        setAddress,
        getAddress,
        clearAddress,
        listInterfaces,
        getInfo
    }
}
