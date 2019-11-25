const getControllerAddress = ({requiresAccount, provider, accountIndex}) => {
    if (requiresAccount) {
        const controllerAddress = provider.getAddress(accountIndex).toLowerCase()
        return {controllerAddress}
    }
    else {
        return {}
    }
}

module.exports = getControllerAddress