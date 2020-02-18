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
        console.log(`Controller: \t\t${info.Controller}`)
        console.log(`Resolver: \t\t${info.Resolver}`)
        console.log(`Address: \t\t${info.Address}`)
        console.log(`Reverse resolver: \t${info.ReverseResolver}`)
        console.log(`Reverse name: \t\t${info.ReverseName}`)
        console.log(`Registrant: \t\t${info.Registrant ? info.Registrant : 'n/a'}`)
        console.log(`Expires: \t\t${info.Expires}`)
    } finally {
        updater.stop()
    }
}
