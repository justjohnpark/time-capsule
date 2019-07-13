# Time Capsule: A Trustless Digital Time Capsule For Images

<b>Time Capsule</b> is a web3 dApp that enables image creators to timelock their creations for a predetermined period of time.

By creating a decentralized time-capsule protocol that deterministically locks any digital asset for a period of time, I: 
  1. <b>Remove</b> the need of need of a third-party trusted custodian to hold a decryption key and keep it secret
  2. <b>Enable</b> a timelock mechanism, where the content becomes publically available after some time
  3. <b>Connect</b> encrypted, content-permanent web objects (via IPFS) to an ethereum-driven timelock mechanism

## How it works

On the front-end, the user uploads a image and inputs a set time period for which they'd like their file to be encrypted, specified to the day. The user should also input a title for each image. 

Because it takes a long time to encrypt image files with RSA encryption, I settled on encrypting each image with AES encryption and using RSA encryption on the AES encryption key. All of this is done on the application-level. The encrypted image is then sent off to IPFS. The IPFS address for the encrypted image, the title of the image, the time-lock period chosen by the user, the encrypted AES key, and the private RSA key are ingested as parameters into the TimeCapsule.sol contract. The encrypted AES key and the private RSA keys remain obfuscated within the contract for a set period of time determined by the user. 

The parameters taken by the TimeCapsule.sol smart-contract are shown summarized below:
```
struct Entry {
  uint256 id;
  uint256 unlockTime;
  address owner;
  string ipfs;
  string title;
  string ec_aes_key;
  string priv_key;
  bool isReleased;
}

```

The user can take three primary actions on Time Capsule. First, s(he) can upload a file and timelock it. The application will create a list of images uploaded to the smart contract by the current ethereum address running on the browser by Metamask. Under each image, the application will list the image's title, IPFS hash, and the unlock time. If an image hasn't been "released" yet, the unlock time will be a link that the user can click on to initiate a transaction to release the image's details from the smart contract. Once that transaction successfully goes through, the IPFS hash will become a link that the user can click on to load the image in the application. 

In future iterations of this project, I envision supporting more media formats besides images, the possibility of seeing other poeple's content beside one's own, adding dvanced content curation techniques like being able to star or follow specific creators, query based on content description, upvote/rank locked content, etc. 

## Potential vulnerabilites

I realize there is a big issue with storing decryption keys on a publically distributed blockchain ledger. While the keys themselves exist as a private variable, annd cannot be called by other contracts, it is still recorded in bytecode on the EVM. An attacker could theoretically attempt to brute force the blockchain dataset for the key binary, but s(he) would have to know the exact length, as well as the IPFS address for the file.

Once I got started on this final project, there simply wasn't enough time to address this concern. Thus, I assume that there's a plausible deterrant in deriving both the key and address from the EVM bytecode for a project that's meant to serve as a learning exercise :)

## How to run the app

1. Clone the repo
```
https://github.com/justjohnpark/time-capsule.git
```

2. cd into the client directory and install dependencies by running:
```
npm install
```

3. You can use the existing migrated contract that's deployed to the rinkeby test network to start the application. Make sure you have Metamask installed and logged in on your browser. And then from the client directory, run: 
```
npm run start
```
4. Instead, if you'd like to redeploy your own instance of the contract, you'll need to first create an Infura account. Once logged in, create a new project to generate an API key, this allows you to track the usage of each individual dApp you deploy. Once your project is created, select the environment we will be deploying to, in this case Rinkeby, from the Endpoint drop down and copy the endpoint URL for future reference. Make sure you save this token and keep it private!

To configure the HDWallet Provider we need to provide a mnemonic which generates the account to be used for deployment. Use the mnemonic of the Metamask account you'll be using with this application. 

Assuming the truffle hd wallet provider is correctly installed, create a `secrets.json` file in `./client` (the same file level as package.json). This file will store your mnemonic and Infura API key so that it can be loaded by the hdwallet provider. The contents of this file should look like: 
```
{
	"mnemonic": "YOUR SECRET MNEMONIC",
	"infuraApiKey": "YOUR INFURA API KEY"
}
```
Next, you'll need to migrate the contract to the rinkeby test network. Use the following command from the client directory:

```
truffle migrate --reset --network rinkeby
```
And then you should be able to use the start the application. Run `npm run start` from the client directory

5. I realize that going through step 4. is a hassle so I've created an infura api key and a new wallet mnemonic with 10 ethereum in it just for whomever is going to review this final project. Normally you don't post this kind of information on github, but I'm including sensitive info of these dummy accounts for convenience and/or to avoid any setup complications for whomever is grading this. Create a file called `secrets.json` in the `./client` directory:
```
{
  "mnemonic": "material layer above biology good physical joke gesture solve media alpha dog",
  "infuraApiKey": "43b3e70ba6ab400c97f6572abce72a90"
}
```
After `secrets.json` is created, continue along with the appropriate step in Step 4. 

## How to run tests

Unforunately, you'll need to follow `Step 4` or `Step 5` in `How to run the app` in order to be able to run tests. Once you have the `secrets.json` file set up, have `ganache-cli` running in a separate terminal window. And then from the client directory, run: 
```
truffle test
```
