const requiresAccount = (argv) => {
    const cmdsNeedAccount = [
        'setContenthash',
        'setAddress',
        'clearAddress',
        'clearContenthash',
        'setReverseName',
        'clearReverseName'
    ]
    const cmdsDontNeedAccount = [
        'getAddress',
        'getContenthash',
        'getInfo',
        'listInterfaces',
        'getReverseName'
    ]
    const command = argv._[0]
    const requiresAccount = cmdsNeedAccount.includes(command)
    const doesNotRequireAccount = cmdsDontNeedAccount.includes(command)
    if ((!requiresAccount) && (!doesNotRequireAccount)) {
        throw Error('Unknown command')
    }
    return {requiresAccount}
}

module.exports = requiresAccount