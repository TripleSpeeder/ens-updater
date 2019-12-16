exports.command = 'getInfo <ensname>'

exports.describe = 'Get various info about ENS name'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
}

exports.handler = async ({updater, ensname}) => {
    try {
        let info = await updater.getInfo()
        console.log(`ENS name '${ensname}:'`)
        console.log('==========================================================')
        console.log(`Controller: \t${info.Controller}`)
        console.log(`Resolver: \t${info.Resolver}`)
        console.log(`Registrant: \t${info.Registrant ? info.Registrant : 'n/a'}`)
        console.log(`Expires: \t${info.Expires}`)
        console.log(`ETH address: \t${info.Address}`)
    } finally {
        updater.stop()
    }
}
