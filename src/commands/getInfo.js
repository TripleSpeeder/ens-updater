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
        console.log(`Controller address: \t\t${info.Controller}`)
        console.log(`Address: \t\t\t${info.Address}`)
        console.log(`Expires: \t\t\t${info.Expires}`)
        console.log(`Resolver contract: \t\t${info.Resolver}`)
        console.log(`Registrant: \t\t\t${info.Registrant ? info.Registrant : 'n/a'}`)
        console.log(`Registrar contract: \t\t${info.Registrar}`)
        console.log(`Reverse resolver contract: \t${info.ReverseResolver}`)
        console.log(`Reverse name: \t\t\t${info.ReverseName}`)
    } finally {
        updater.stop()
    }
}
