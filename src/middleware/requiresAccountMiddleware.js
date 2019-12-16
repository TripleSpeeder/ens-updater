const requiresAccount = (argv) => {
    const cmdsNeedAccount = ['setContenthash', 'setAddress', 'clearAddress']
    const cmdsDontNeedAccount = ['getAddress', 'getContenthash', 'getInfo', 'listInterfaces']
    const command = argv._[0]
    const requiresAccount = cmdsNeedAccount.includes(command)
    const doesNotRequireAccount = cmdsDontNeedAccount.includes(command)
    if ((!requiresAccount) && (!doesNotRequireAccount)) {
        throw Error('Unknown command')
    }
    return {requiresAccount}
}

module.exports = requiresAccount