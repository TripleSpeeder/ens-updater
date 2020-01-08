const {decode, encode, getCodec} = require('content-hash')
const namehash = require('eth-ens-namehash')
const contract = require('@truffle/contract')
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')
const RegistryABI = require('@ensdomains/ens/build/contracts/ENSRegistryWithFallback')
const RegistrarABI = require('@ensdomains/ethregistrar/build/contracts/BaseRegistrarImplementation.json')
const {formatsByCoinType} = require('@ensdomains/address-encoder')
const RegistryAddresses = require('./ENSAddresses')
const ResolverInterfaces = require('./ResolverInterfaces')


module.exports = function Updater() {

    // module variables
    let resolver, registry, registrar, controllerAddress, verbose, node, web3, ensName, dryrun, estimateGas, gasPrice, gas
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    const coinTypeETH = 60

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

    function getReverseLookupName(address) {
        if (address.startsWith('0x')) {
            address = address.slice(2)
        }
        return `${address.toLowerCase()}.addr.reverse`
    }

    function isMethodConstant(contract, methodkey) {
        // check ABI if this is a constant function
        // Find the first method that matches the name. There might be overloaded variants, but they will
        // all have the same mutability, so just take first entry with [0]
        const method = methodkey.split('(', 1)[0]
        const abi = contract.abi.filter(entry => (entry.name === method))[0]
        return abi.constant
    }

    async function execute(contract, methodkey, ...args) {
        let resultType
        let doDryrun = dryrun

        if(isMethodConstant(contract, methodkey)) {
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
            // Only set gas when explicitly provided. Truffle will do automatic calculation of required gas if
            // not specified.
            if (gas !== undefined) {
                transactionOptions.gas = gas
            }
            args.push(transactionOptions)
            resultType = 'transaction' // Desired result is a transaction hash. Will return result.tx
        }

        let func = contract.methods[methodkey]
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

    // ENS access functions
    async function getController() {
        try {
            let controller = await registry.owner(node)
            return controller.toLowerCase()
        } catch(error) {
            throw Error(`Failed to get owner of node ${node}. Error: ${error}`)
        }
    }

    async function getRegistrant() {
        // Only the first level domain is a token and supports ownerOf method.
        // Subdomains don't have this concept, so return "undefined"
        const labels = ensName.split('.')
        if (labels.length === 2) {
            const keccac256 = web3.utils.soliditySha3(labels[0])
            try {
                return await registrar.ownerOf(keccac256)
            } catch (error) {
                throw Error(`Failed to get registrant. Error: ${error}`)
            }
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
            return 0
        }
    }

    // setup & command implementation
    async function setup(options) {
        dryrun = options.dryrun
        estimateGas = options.estimateGas
        verbose = options.verbose
        controllerAddress = options.controllerAddress
        web3 = options.web3
        gasPrice = options.gasPrice
        gas = options.gas
        ensName = options.ensName

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

        if (ensName) {
            node = namehash.hash(ensName)
            // get ENS registrar
            // TODO: I'm assuming that the registrar is the permanent registrar. Should explicitly check the type or registrar
            // and use the matching contract ABI!

            // check if the ensName has been migrated already to the new registry
            let registrarAddress
            const existsInNewRegistry = await registry.recordExists(node)
            if (existsInNewRegistry) {
                verbose && console.log(`${ensName} is migrated to new registry`)
                registrarAddress = await registry.owner(namehash.hash(getTLD(ensName)))
            } else {
                verbose && console.log(`${ensName} is not migrated to new registry`)
                const oldRegistryAddress = await registry.old()
                verbose && console.log(`Using old registry at ${oldRegistryAddress} to obtain registrar`)
                let oldRegistry = await registryContract.at(oldRegistryAddress)
                registrarAddress = await oldRegistry.owner(namehash.hash(getTLD(ensName)))
            }
            const registrarContract = contract(RegistrarABI)
            registrarContract.setProvider(web3.currentProvider)
            registrar = await registrarContract.at(registrarAddress)

            // try to get resolver
            const resolverAddress = await registry.resolver(node)
            if (resolverAddress !== '0x0000000000000000000000000000000000000000') {
                const resolverContract = contract(ResolverABI)
                resolverContract.setProvider(web3.currentProvider)
                resolver = await resolverContract.at(resolverAddress)
            }
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

    async function setAddress({address, coinType}) {
        await verifyResolver()
        await verifyController()
        if (coinTypeETH === coinType) {
            await verifyAddress(address)
            await verifyInterface('Ethereum Address')
            verbose && console.log('Updating Ethereum address...')
            try {
                return await execute(resolver, 'setAddr(bytes32,address)', node, address)
            } catch(error) {
                throw Error(`Error performing setAddr(): ${error}`)
            }
        } else {
            // Is there a reasonable way to verify other blockchain addresses?
            await verifyInterface('Blockchain Address')
            verbose && console.log('Updating blockchain address...')
            let decodedAddress = formatsByCoinType[coinType].decoder(address)
            try {
                return await execute(resolver, 'setAddr(bytes32,uint256,bytes)', node, coinType, decodedAddress)
            } catch(error) {
                throw Error(`Error performing setAddr(): ${error}`)
            }
        }
    }

    async function clearAddress(coinType) {
        await verifyResolver()
        await verifyController()
        const coinSymbol = formatsByCoinType[coinType].name
        verbose && console.log(`Clearing ${coinSymbol} address`)
        if (coinTypeETH === coinType) {
            await verifyInterface('Ethereum Address')
            try {
                let result = await execute(resolver, 'setAddr(bytes32,address)', node, zeroAddress)
                return result
            } catch (error) {
                throw Error(`Error clearing ${coinSymbol} address: ${error}`)
            }
        } else {
            await verifyInterface('Blockchain Address')
            try {
                let result = await execute(resolver, 'setAddr(bytes32,uint256,bytes)', node, coinType, [])
                return result
            } catch (error) {
                throw Error(`Error clearing ${coinSymbol} address: ${error}`)
            }
        }
    }

    async function getAddress(coinType) {
        await verifyResolver()
        const coinSymbol = formatsByCoinType[coinType].name
        verbose && console.log(`Getting ${coinSymbol} address...`)
        if (coinTypeETH === coinType) {
            await verifyInterface('Ethereum Address')
            try {
                const result = await execute(resolver, 'addr(bytes32)', node)
                return result
            } catch (error) {
                throw Error(`Error obtaining ${coinSymbol} address: ${error}`)
            }
        } else {
            await verifyInterface('Blockchain Address')
            try {
                let result = await execute(resolver, 'addr(bytes32,uint256)', node, coinType)
                if (result === null) {
                    result = zeroAddress
                } else {
                    result = formatsByCoinType[coinType].encoder(Buffer.from(result.slice(2), 'hex'))
                }
                return result
            } catch (error) {
                throw Error(`Error obtaining ${coinSymbol} address: ${error}`)
            }
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
            let result = await execute(resolver, 'setContenthash(bytes32,bytes)', node, encodedHash)
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
            let result = await execute(resolver, 'setContenthash(bytes32,bytes)', node, [])
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
            const result = await execute(resolver, 'contenthash(bytes32)', node)
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
                const support = await execute(resolver, 'supportsInterface(bytes4)', ResolverInterfaces[interfaceName])
                support && supportedInterfaces.push(interfaceName)
            }
        } catch(error) {
            throw Error(`Error querying interfaces: ${error}`)
        }
        return supportedInterfaces
    }

    async function getReverseName(address) {
        await verifyAddress(address)
        verbose && console.log(`Getting reverse resolver for ${address}...`)
        const reverseNode = namehash.hash(getReverseLookupName(address))
        const reverseResolverAddress = await registry.resolver(reverseNode)
        if (reverseResolverAddress === zeroAddress) {
            throw Error(`No reverse resolver set for ${address}`)
        }
        verbose && console.log(`Querying reverse resolver at ${reverseResolverAddress}...`)
        const reverseResolverContract = contract(ResolverABI)
        reverseResolverContract.setProvider(web3.currentProvider)
        const reverseResolver = await reverseResolverContract.at(reverseResolverAddress)
        return await execute(reverseResolver, 'name(bytes32)', reverseNode)
    }

    async function getInfo() {
        const controller = await getController()
        const registrant = await getRegistrant()
        const expires = await getExpires()
        let address = zeroAddress
        try {
            address = await getAddress(coinTypeETH)
        }catch(error){
            // Can't obtain address, likely due to no resolver being set. Ignore.
        }
        let reverseName = undefined
        if (address !== zeroAddress) {
            try {
                reverseName = await getReverseName(address)
            }catch(error){
                // Can't obtain reverse name record, likely due to no reverse
                // resolver being set. Ignore.
            }
        }
        return {
            Registrant: registrant ? registrant : 'n/a',
            Controller: controller,
            Resolver: resolver ? resolver.address : zeroAddress,
            Expires: (expires > 0) ? new Date(expires*1000) : 'n/a',
            Address: address,
            ReverseName: reverseName ? reverseName : 'n/a'
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
        getReverseName,
        clearAddress,
        listInterfaces,
        getInfo
    }
}
