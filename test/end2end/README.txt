To run end-2-end tests:

1. Start ganache-cli with mnemonic from testdata.js:
> ganache-cli -m "spot pact fashion alert item unveil current choice emerge merge orient tribe"

2. Deploy necessary contracts:
> truffle migrate

3. Run test preparation script
> node scripts/prepareTests.js

4. Run tests:
> mocha test/end2end
