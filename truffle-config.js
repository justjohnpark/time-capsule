const path = require("path");
const HDWalletProvider = require("./client/node_modules/truffle-hdwallet-provider");
const fs = require('fs');

let secrets;

if (fs.existsSync("secrets.json")) {
  secrets = JSON.parse(fs.readFileSync("secrets.json", 'utf8'));
}

console.log(secrets);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
    },
    rinkeby: {
      provider: new HDWalletProvider(secrets.mnemonic, "https://rinkeby.infura.io/v3/"+secrets.infuraApiKey),
      network_id: '4'
    }
  }
};