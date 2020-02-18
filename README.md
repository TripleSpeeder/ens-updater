[![Build Status](https://travis-ci.com/TripleSpeeder/ens-updater.svg?branch=develop)](https://travis-ci.com/TripleSpeeder/ens-updater)
[![npm](https://img.shields.io/npm/v/@triplespeeder/ens-updater)](https://www.npmjs.com/package/@triplespeeder/ens-updater)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

# ens-updater

> Manage ENS names from the commandline

ens-updater enables automated update of e.g. contentHash records in the Ethereum Name System. 

## Table of Contents

- [Overview](#overview)
- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Testing](#testing)
- [Contributing](#contributing)
- [Maintainers](#maintainers)
- [License](#license)
- [Development support](#development-support)

## Overview
### Design goals:
 - provide an all-purpose cli for managing ENS names
 - integrate well in deployment scripts and CI environments

### Notable features:
- Get/set ENS name records
- For each operation verifies that the resolver contract of an ENS-name implements the required interface 
via EIP165 "supportsInterface"
- Show interfaces a resolver implements (command "listInterfaces")
- Includes "--estimateGas" option to check the required gas for a command
- Bash completion support (try command "completion" to set it up)  
- Can read input from stdin to support piping with other tools
- Options can be set via json configfile (see [config file support](#config-file-support))

## Security
In order to perform an update of an ENS record, `ens-update` needs the private key of the
Ethereum account controlling the ENS name. The private key needs to be provided via environment variable or
through the file `.env` in the working directory.

- **NEVER share .env file with anybody**
- **NEVER check .env into version control**
- **NEVER publish .env in any other way**


The private key can be provided either directly or through a mnemonic
#### Provide the private key
Example contents of `.env`:
```bash
PRIVATE_KEY=<private key here, without leading 0x>
```
#### Provide the mnemonic
Example contents of `.env`:
```bash
MNEMONIC=<mnemonic phrase here>
```
By default the first account will be used. If you need to use another account provide the option --accountindex.

Remember - The mnemonic gives full control to **all** accounts of the according wallet!

## Background
For information on the Ethereum Name System see the [ENS documentation](https://docs.ens.domains/).

## Install
```
npm install -g @triplespeeder/ens-updater
```

## Usage
The following commands are implemented:
 - getInfo for a quick summary
 - get/set contenthash
 - get/set address record (including eip-2304 Multichain support)
 - get/set reverse name records
 - get list of interfaces resolver supports
 - setup bash completion

PRs to extend functionality are welcome :)

```
> ens-updater --help
Usage: ens-updater <command> [options]

Commands:
  ens-updater.js getInfo <ensname>                                       Get various info about ENS name
  ens-updater.js setContenthash <ensname> <contenttype> <contenthash>    Set contenthash record
  ens-updater.js getContenthash <ensname>                                Get contenthash record
  ens-updater.js clearContenthash <ensname>                              Clear contenthash record
  ens-updater.js setAddress <ensname> <address> [coinname]               Set address record
  ens-updater.js getAddress <ensname> [coinname]                         Get address record
  ens-updater.js clearAddress <ensname> [coinname]                       Clear address record
  ens-updater.js setReverseName <reverseName>                            Set reverse name record of calling address
  ens-updater.js getReverseName <address>                                Get reverse name record of address
  ens-updater.js clearReverseName                                        Clear reverse name record of calling address
  ens-updater.js listInterfaces <ensname>                                List interfaces resolver supports
  ens-updater.js completion                                              generate completion script

Options:
  --version           Show version number                                                          [boolean]
  --verbose, -v       Verbose output                                              [boolean] [default: false]
  --web3              Web3 connection string                                             [string] [required]
  --estimateGas       Estimate required gas for transactions                      [boolean] [default: false]
  --gasPrice          Gas price to set for transaction (unit 'gwei'). Defaults to 10. [number] [default: 10]
  --gas               Gas to provide for transaction (omit to use automatic calculation)            [number]
  --dry-run           Do not perform any real transactions                        [boolean] [default: false]
  --accountindex, -i  Account index. Defaults to 0                                     [number] [default: 0]
  --registryAddress   Optional contract address of the ENS Registry.                                [string]
  --help, -h          Show help                                                                    [boolean]

contact: michael@m-bauer.org
github: https://github.com/TripleSpeeder/ens-updater
```

#### Example
On Ropsten network, set the contentHash of the name `ens-updater.eth` to the IPFS CID `QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU`:
```
> ens-updater setContenthash ens-updater.eth ipfs-ns QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU --web3 http://ropsten.dappnode:8545 --verbose
Setting up web3 & HDWallet provider...
        Running on chain ID 3
Verifying ensName owner
Verifying content hash...
Updating contenthash...
        Successfully stored new contentHash. Transaction hash: 0x0b8cdb75ff3b514c974ccd0bdef7cc3557bfab934b39caba30c38b88d375d705.
Exiting...
> 
```

#### Reading values from stdin
Setting the value "stdin" for option `contenthash` or `address` reads the contenthash/address to set from stdin. This is useful
to build a chain of commands in a deploy script. 

For example you can use [ipfs-deploy](https://www.npmjs.com/package/ipfs-deploy) to publish a website to IPFS
and directly pipe the CID returned by ipfs-deploy into ens-updater:

```
> ipfs-deploy -d dappnode | ens-updater setContenthash ens-updater.eth ipfs-ns stdin --web3 http://ropsten.dappnode:8545 --verbose
Getting contenthash from stdin...
         Got contenthash: QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU.
Setting up web3 & HDWallet provider...
...
```

#### Config file support
All options can be provided through a json config file. The config file can be set with
`--config <configfile.json>` option.

Example config file that sets web3 connection string and custom registry address:
```json
{
  "web3": "http://127.0.0.1:9545",
  "registryAddress": "0x112234455c3a32fd11230c42e7bccd4a84e02010"
}
```
Usage example:
```
> ens-updater listInterfaces example.domain.eth --config myconfig.json
```
 
## Testing

### Unittests
Unittests are plain mocha tests located in folder "unitTests". They do not require ganache or other 
node to run.

Execute tests with `npm run test:unit` 

### Integration and end-to-end tests
These tests are implemented with truffle and require a local ganache instance to run. Tests are organized in folders:
- `test/lib/`: Tests of the core functionality from the `src/lib` folder
- `test/middleware/`: Tests of yargs middleware that needs to interact with a live node
- `test/end2end/`: Tests of the actual binary. Each test executes `ens-updater` as a childprocess and verifies the output
 
To execute the tests:
1. Start ganache-cli in a dedicated terminal in deterministic mode: 
 `ganache-cli -d`
2. Run truffle tests in another terminal:
 `npm run test:truffle`


## Contributing

PRs are welcome! Have a look at the [open issues](https://github.com/TripleSpeeder/ens-updater/issues) or create a new 
issue if you are missing functionality.

Pull requests should be against the "development" branch.

### Commits
Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/) guidelines. This is
also checked via git hooks and husky.

Structure:
```
<type> <description>

[optional body]

[optional footer(s)]
```

Supported types:
- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **test**: Adding missing tests or correcting existing tests

## Maintainers
[@TripleSpeeder](https://github.com/TripleSpeeder)

## Development support
If you like this project consider contributing to the gitcoin grant: **https://gitcoin.co/grants/218/ens-updater**.

If you prefer direct donations please use: **ens-updater.eth** (0x8651Cf790fc894512a726A402C9CAAA3687628f0)

## License
MIT

© 2019 - 2020 Michael Bauer
