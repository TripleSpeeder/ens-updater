const execa = require("execa")


module.exports.runCommand = function runCommand(command, options={}) {
    let childResult
    try {
        childResult = execa.commandSync(command, options)
    } catch(childResultError) {
        childResult = childResultError
    }
    return childResult
}
