
module.exports = {
  // mnemonic and private keys used by ganache in deterministic mode (-d)
  wallet: {
    mnemonic: 'myth like bonus scare over problem client lizard pioneer submit female collect',
    private_keys: [
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
      '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
      '0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913',
      '0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743',
      '0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd',
      '0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52',
      '0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3',
      '0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4',
      '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773',
    ]
  },
  // Testcases for other blockchain addresses taken from EIP 2304 (https://eips.ethereum.org/EIPS/eip-2304)
  blockchainAddressTestcases: [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      cointypeIndex: 0,
      addresses: [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '3Ai1JZ8pdJb2ksieUV8FsxSNVJCpoPi8W6',
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      ]
    },
    {
      name: 'Litecoin',
      symbol: 'LTC',
      cointypeIndex: 2,
      addresses: [
        'LaMT348PWRnrqeeWArpwQPbuanpXDZGEUz',
        'MQMcJhpWHYVeQArcZR3sBgyPZxxRtnH441',
        'ltc1qdp7p2rpx4a2f80h7a4crvppczgg4egmv5c78w8'
      ]
    },
    {
      name: 'Dogecoin',
      symbol: 'DOGE',
      cointypeIndex: 3,
      addresses: [
        'DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD',
        'AF8ekvSf6eiSBRspJjnfzK6d1EM6pnPq3G'
      ]
    },
    {
      name: 'Monacoin',
      symbol: 'MONA',
      cointypeIndex: 22,
      addresses: ['MHxgS2XMXjeJ4if2PRRbWYcdwZPWfdwaDT']
    },
    {
      name: 'Ethereum Classic',
      symbol: 'ETC',
      cointypeIndex: 61,
      addresses: ['0x314159265dD8dbb310642f98f50C066173C1259b']
    },
    {
      name: 'Rootstock',
      symbol: 'RSK',
      cointypeIndex: 137,
      addresses: ['0x5aaEB6053f3e94c9b9a09f33669435E7ef1bEAeD']
    },
    {
      name: 'Ripple',
      symbol: 'XRP',
      cointypeIndex: 144,
      addresses: [
        'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
        'X7qvLs7gSnNoKvZzNWUT2e8st17QPY64PPe7zriLNuJszeg'
      ]
    },
    {
      name: 'Bitcoin Cash',
      symbol: 'BCH',
      cointypeIndex: 145,
      addresses: [
        'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
        'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
      ]
    },
    {
      name: 'Binance',
      symbol: 'BNB',
      cointypeIndex: 714,
      addresses: ['bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2']
    }
  ]
}