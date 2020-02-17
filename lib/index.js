const {decode, encode, getCodec} = require('content-hash')
const namehash = require('eth-ens-namehash')
const contract = require('@truffle/contract')
const ResolverABI = require('@ensdomains/resolver/build/contracts/Resolver.json')
const RegistryABI = require('@ensdomains/ens/build/contracts/ENSRegistryWithFallback')
const OldRegistryABI = require('@ensdomains/ens/build/contracts/ENSRegistry')
const RegistrarABI = require('@ensdomains/ethregistrar/build/contracts/BaseRegistrarImplementation.json')
const ReverseRegistrarABI = require('@ensdomains/ens/build/contracts/ReverseRegistrar')
const {formatsByCoinType} = require('@ensdomains/address-encoder')
const RegistryAddresses = require('./ENSAddresses')
const ResolverInterfaces = require('./ResolverInterfaces')


module.exports = function Updater() {

    // module variables
    let resolver, registry, registrar, reverseRegistrar, controllerAddress, verbose, node, web3, ensName, dryrun, estimateGas, gasPrice, gas
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    const coinTypeETH = 60
    controllerAddress = zeroAddress

    // validator functions
    async function verifyResolver() {
        if (!resolver) {
            throw Error(`No resolver set for ${ensName}`)
        }
    }

    async function verifyController() {
        verbose && console.log('Verifying ensName controller')
        const controller = await getController(node)
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

    async function verifyAddress(_address) {
        if (!web3.utils.isAddress(_address)) {
            throw Error(`${_address} is not a valid Ethereum address`)
        }
    }

    // helper functions
    function getTLD(ensName) {
        return ensName.split('.').pop()
    }

    async function getRegistrar(ensName) {
        verbose && console.log(`Getting Registrar address...`)
        const registrarAddress = await registry.owner(namehash.hash(getTLD(ensName)))
        // TODO: I'm assuming that the registrar is the official permanent registrar. Should explicitly
        //  check this, e.g. by comparing with well-known registrar addresses.
        verbose && console.log(`\tUsing PermanentRegistrar at ${registrarAddress}`)
        const registrarContract = contract(RegistrarABI)
        registrarContract.setProvider(web3.currentProvider)
        return await registrarContract.at(registrarAddress)
    }

    async function getResolver(_registry, _node) {
        const resolverAddress = await _registry.resolver(_node)
        if (resolverAddress !== '0x0000000000000000000000000000000000000000') {
            const resolverContract = contract(ResolverABI)
            resolverContract.setProvider(web3.currentProvider)
            return await resolverContract.at(resolverAddress)
        } else {
            return undefined
        }
    }

    async function getReverseResolver(reverseNode) {
        const reverseResolverAddress = await registry.resolver(reverseNode)
        if (reverseResolverAddress === zeroAddress) {
            return undefined
        }
        verbose && console.log(`Getting reverse resolver...`)
        const reverseResolverContract = contract(ResolverABI)
        reverseResolverContract.setProvider(web3.currentProvider)
        return await reverseResolverContract.at(reverseResolverAddress)
    }

    function getReverseLookupName(_address) {
        if (_address.startsWith('0x')) {
            _address = _address.slice(2)
        }
        return `${_address.toLowerCase()}.addr.reverse`
    }

    async function getReverseNode(address) {
        await verifyAddress(address)
        const revLookupName = getReverseLookupName(address)
        return namehash.hash(revLookupName)
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

    async function getController(_node) {
        try {
            let controller = await registry.owner(_node)
            return controller.toLowerCase()
        } catch(error) {
            throw Error(`Failed to get owner of node ${_node}. Error: ${error}`)
        }
    }

    async function getReverseRegistrar(name) {
        const reverseNode = namehash.hash(name)
        const reverseRegistrarAddress = await getController(reverseNode)
        if (reverseRegistrarAddress === zeroAddress) {
            throw Error(`'${name}' has no owner -> No ReverseRegistrar is available`)
        }
        const reverseRegistrarContract = contract(ReverseRegistrarABI)
        reverseRegistrarContract.setProvider(web3.currentProvider)
        return await reverseRegistrarContract.at(reverseRegistrarAddress)
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

        // get reverse registrar
        reverseRegistrar = await getReverseRegistrar('addr.reverse')

        // If ensName is provided, get its registrar and resolver
        if (ensName) {
            // check if name exists in new registry
            node = namehash.hash(ensName)
            if (!await registry.recordExists(node)) {
                verbose && console.log(`\t${ensName} is not existing in new registry`)
                const oldRegistryAddress = await registry.old()
                verbose && console.log(`\tChecking old registry at ${oldRegistryAddress}`)
                const oldRegistryContract = contract(OldRegistryABI)
                oldRegistryContract.setProvider(web3.currentProvider)
                const oldRegistry = await oldRegistryContract.at(oldRegistryAddress)
                resolver = await getResolver(oldRegistry, node)
                if (resolver) {
                    console.log(`\tFound resolver in old registry. This name needs to be migrated!`)
                    // keep using old registry for this session
                    registry = oldRegistry
                } else {
                    console.log(`\tNo resolver found in old registry`)
                }
            } else {
                resolver = await getResolver(registry, node)
            }
            registrar = await getRegistrar(ensName)
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
        verbose && console.log(`Getting reverse name for ${address}...`)
        const reverseNode = await getReverseNode(address)
        const reverseResolver = await getReverseResolver(reverseNode)
        if (!reverseResolver) {
            return ''
        }
        return await execute(reverseResolver, 'name(bytes32)', reverseNode)
    }

    async function setReverseName(reverseName) {
        verbose && console.log(`Setting reverse name ${reverseName} for address ${controllerAddress}...`)
        try {
            return await execute(reverseRegistrar, 'setName(string)', reverseName)
        } catch(error) {
            throw Error(`Error performing setReverseName(): ${error}`)
        }
    }

    async function clearReverseName() {
        verbose && console.log(`Clearing reverse name for address ${controllerAddress}...`)
        try {
            return await execute(reverseRegistrar, 'setName(string)', '')
        } catch(error) {
            throw Error(`Error performing clearReverseName(): ${error}`)
        }
    }

    async function getInfo() {
        const controller = await getController(node)
        const registrant = await getRegistrant()
        const expires = await getExpires()
        let resolvedAddress = zeroAddress
        try {
            resolvedAddress = await getAddress(coinTypeETH)
        }catch(error){
            // Can't obtain address, likely due to no resolver being set. Ignore.
        }
        let reverseName = undefined
        let reverseResolver = undefined
        if (resolvedAddress !== zeroAddress) {
            try {
                reverseName = await getReverseName(resolvedAddress)
                const reverseNode = await getReverseNode(resolvedAddress)
                reverseResolver = await getReverseResolver(reverseNode)
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
            Address: resolvedAddress,
            ReverseResolver: reverseResolver ? reverseResolver.address: zeroAddress,
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
        clearAddress,
        setReverseName,
        getReverseName,
        clearReverseName,
        listInterfaces,
        getInfo
    }
}
