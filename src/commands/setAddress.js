exports.command = 'setAddress'
exports.describe = 'Set the address for an ENS name'
exports.builder  = (yargs) => {
    return yargs.options({
        'address': {
            description: 'Ethereum address to set or \'stdin\' to read from stdin',
            type: 'string',
            demandOption: true,
        },
    })
}

exports.handler = async ({address, verbose, updater, dryrun}) => {
    if (address === 'stdin') {
        verbose && console.log('Reading address from stdin...')
        address = fs.readFileSync(0).toString().trim();
        verbose && console.log(`\t Got address: ${address}.`)
    }
    let result = await updater.setAddress({
        address,
        dryrun
    })
    console.log(result)
}
