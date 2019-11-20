exports.command = 'listInterfaces <ensname>'

exports.describe = 'Get list of interfaces resolver supports'

exports.builder = (yargs) => {
    return yargs
    .positional('ensname', {
        description: 'ENS Name to query or update',
        type: 'string',
    })
}

exports.handler = async ({updater}) => {
    let interfaces = await updater.listInterfaces()
    if (interfaces.length) {
        console.log(`Resolver supports ${interfaces.length} interfaces:`)
        for (const i of interfaces) {
            console.log(` - ${i}`)
        }
    } else {
        console.log(`Resolver does not support any interface`)
    }
}
