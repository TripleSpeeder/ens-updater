const requiresAccount = (argv) => {
    const command = argv._[0]
    const requiresAccount = ['setContenthash', 'setAddress'].includes(command);
    return {requiresAccount}
}

module.exports = requiresAccount