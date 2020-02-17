const fs = require('fs')

exports.command = 'setReverseName <reverseName>'

exports.describe = 'Set reverse name record of calling address'

exports.builder = (yargs) => {
    return yargs
    .positional('reverseName', {
        description: 'Name to set or \'stdin\' to read from stdin',
        type: 'string',
    })
}

exports.handler = async ({reverseName, verbose, updater}) => {
    if (reverseName === 'stdin') {
        verbose && console.log('Reading reverse name from stdin...')
        reverseName = fs.readFileSync(0).toString().trim()
        verbose && console.log(`\t Got reverse name: ${reverseName}.`)
    }
    let result = await updater.setReverseName(reverseName)
    console.log(result)
    await updater.stop()
}
