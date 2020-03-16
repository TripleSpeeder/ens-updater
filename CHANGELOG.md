# [1.9.0](https://github.com/TripleSpeeder/ens-updater/compare/v1.8.2...v1.9.0) (2020-02-18)


### Bug Fixes

* be less verbose in connection check phase ([dbbf885](https://github.com/TripleSpeeder/ens-updater/commit/dbbf885f7023632823e3b783cb6f58363666ebf9))
* dont print gas price info for read-only commands ([32322d6](https://github.com/TripleSpeeder/ens-updater/commit/32322d6bfb435d2df3b9b948ff6d451a163499f5))
* make sure process exits after set-/clear-ReverseName commands ([5a19ca6](https://github.com/TripleSpeeder/ens-updater/commit/5a19ca611875d15a0eee091d445d2be1f1266b5a))


### Features

* add command clearReverseName ([7906183](https://github.com/TripleSpeeder/ens-updater/commit/79061838e726d957a046c6a4bc084818f6c5cfd0))
* add methods to get and set reverseName ([01f7fb9](https://github.com/TripleSpeeder/ens-updater/commit/01f7fb961f6dd6aa331b0143d291fc554cd6fe53))
* dont allow modifications for not-migrated names ([1ec833d](https://github.com/TripleSpeeder/ens-updater/commit/1ec833dd3155cf747b726933b19979d9ec1f7d90))
* extend getInfo command output ([bc0ece4](https://github.com/TripleSpeeder/ens-updater/commit/bc0ece4f2b23927b1f21cdd284e7bd05576f2c9b))
* implement getReverseName command ([2bede14](https://github.com/TripleSpeeder/ens-updater/commit/2bede14b7e4c1a2dc26b9b583d3332f4bdd8da3d))
* implement setReverseName command ([97f8fef](https://github.com/TripleSpeeder/ens-updater/commit/97f8fefa4d0adc303e152b10bc41e7a753fd9088))
* include reverse name record in getInfo command ([856472f](https://github.com/TripleSpeeder/ens-updater/commit/856472fd11beae06f1c39c15cf098b6ddc1edfcb))
* show big notice for not-yet-migrated ENS names ([70845cd](https://github.com/TripleSpeeder/ens-updater/commit/70845cd9d7b899c59708c670b987d4711a63305d))

## [1.8.2](https://github.com/TripleSpeeder/ens-updater/compare/v1.8.1...v1.8.2) (2020-01-31)


### Bug Fixes

* use new ENS Registry contract ([d5c2824](https://github.com/TripleSpeeder/ens-updater/commit/d5c28240ab04cf63ee47b99ffbc434de8ebddbbf))

## [1.8.1](https://github.com/TripleSpeeder/ens-updater/compare/v1.8.0...v1.8.1) (2020-01-07)


### Bug Fixes

* set default coinType for getInfo command ([1fcf802](https://github.com/TripleSpeeder/ens-updater/commit/1fcf802d6524ddd8ed6cd70af03b7e75b502e1fa)), closes [#69](https://github.com/TripleSpeeder/ens-updater/issues/69)

# [1.8.0](https://github.com/TripleSpeeder/ens-updater/compare/v1.7.0...v1.8.0) (2020-01-07)


### Bug Fixes

* return 0x0000 instead of 'null' for unset address records ([b370e77](https://github.com/TripleSpeeder/ens-updater/commit/b370e770039b6864f1e65f336236d0fd5fc229be))


### Features

* add multicoin support for address records ([9239570](https://github.com/TripleSpeeder/ens-updater/commit/9239570826379108048e939d2838d5113c56c4f8))

# [1.7.0](https://github.com/TripleSpeeder/ens-updater/compare/v1.6.0...v1.7.0) (2020-01-05)


### Features

* add clearContenthash command ([fad9be2](https://github.com/TripleSpeeder/ens-updater/commit/fad9be214304dc314fc93df4d61bc7d55a190baa))
* add optional --gas option ([067807a](https://github.com/TripleSpeeder/ens-updater/commit/067807a3cc5fdc425ec59b8f0c6bad54da326f0a)), closes [#41](https://github.com/TripleSpeeder/ens-updater/issues/41)

# [1.6.0](https://github.com/TripleSpeeder/ens-updater/compare/v1.5.1...v1.6.0) (2019-12-13)


### Features

* add --gasPrice option ([7e5fe18](https://github.com/TripleSpeeder/ens-updater/commit/7e5fe18f4e66d244f829bfe5bd9b80c0e34e6b99)), closes [#39](https://github.com/TripleSpeeder/ens-updater/issues/39)

## [1.5.1](https://github.com/TripleSpeeder/ens-updater/compare/v1.5.0...v1.5.1) (2019-12-10)


### Bug Fixes

* allow connecting to infura nodes ([68fa986](https://github.com/TripleSpeeder/ens-updater/commit/68fa986d9df75064da1f5dc1b7a12c6a4357bdff)), closes [#45](https://github.com/TripleSpeeder/ens-updater/issues/45)
* process hangs when using websocket provider ([85a26ef](https://github.com/TripleSpeeder/ens-updater/commit/85a26ef7da36e0a86a20f47e228147d04d7aeff5)), closes [#46](https://github.com/TripleSpeeder/ens-updater/issues/46)

# [1.5.0](https://github.com/TripleSpeeder/ens-updater/compare/v1.4.0...v1.5.0) (2019-12-09)


### Features

* add getInfo command ([95decc8](https://github.com/TripleSpeeder/ens-updater/commit/95decc805609d58921f0092ec586e69dad95d11d)), closes [#13](https://github.com/TripleSpeeder/ens-updater/issues/13)
* add option --estimateGas ([2438e19](https://github.com/TripleSpeeder/ens-updater/commit/2438e190a5758d1dc0b19b2914a8a93b425f8158)), closes [#38](https://github.com/TripleSpeeder/ens-updater/issues/38)

# [1.4.0](https://github.com/TripleSpeeder/ens-updater/compare/v1.3.2...v1.4.0) (2019-12-06)


### Features

* update README.md ([0deb8ce](https://github.com/TripleSpeeder/ens-updater/commit/0deb8ce3ef4711665cbcaa2e7c75e703c339d003))
