# ens-updater

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Set the contenthash for ENS names from the commandline

This tool enables automated update of contentHash records in the Ethereum Name System. 
It is designed to integrate well in deployment scripts or CI environments. 


## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Security
In order to perform an update of an ENS record, `ens-update` needs the private keys of the
Ethereum account controlling the ENS name. The private keys are derived from the the mnemonic
provided through a `.env` file in the working directory. 

Example contents of `.env`:
```bash
MNEMONIC=fit repeat flame beauty knife cereal urge amateur steak thought denial negative
```
Remember - The mnemonic gives full control to all accounts of the according wallet!

- **NEVER share this file with anybody**
- **NEVER check it into version control**
- **NEVER publish in any other way**

## Background
For information on the Ethereum Name System see the [ENS documentation](https://docs.ens.domains/).

## Install

```
npm install -g @triplespeeder/ens-updater
```

## Usage
At the moment only the command setContenthash is implemented. PRs to extend functionality are welcome :)
```
 > ens-updater setContenthash
ens-updater setContenthash

Set the contenthash for an ENS name

Options:
  --version              Show version number                           [boolean]
  --web3                 Web3 connection string              [string] [required]
  --accountindex, -i     Account index. Defaults to 0      [number] [default: 0]
  --ensname, --ens       ENS Name to update                  [string] [required]
  --contenttype, --type  Type of content hash to set (e.g ipfs, swarm, ...)
                                                             [string] [required]
  --contenthash, --hash  Content hash to set                 [string] [required]
  --dry-run              Do not perform any real transactions
                                                      [boolean] [default: false]
  --quiet, -q            Suppress console output. Set this when running from a
                         script/CI environment        [boolean] [default: false]
  --registryaddress      Optional contract address of the ENS Registry. [string]
  --help, -h             Show help                                     [boolean]
```

Real example:
On Ropsten network, set the contentHash of the name `ens-updater.eth` to the IPFS CID `QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU`:
```shell script
> ens-updater setContenthash --ensname ens-updater.eth --contenttype ipfs --contenthash QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU --web3 http://ropsten.dappnode:8545
Setting up web3 & HDWallet provider...
        Running on chain ID 3
Verifying ensName owner
Verifying content hash...
Updating contenthash...
        Successfully stored new contentHash. Transaction hash: 0x0b8cdb75ff3b514c974ccd0bdef7cc3557bfab934b39caba30c38b88d375d705.
Exiting...
> 
```

## Maintainers

[@TripleSpeeder](https://github.com/TripleSpeeder)

## Contributing

PRs accepted!

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT 

© 2019 Michael Bauer
