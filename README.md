# OurMetaverseDAO NFT Contract

http://our-metaverse.xyz/

## About OurMetaverseDAO NFT Contract

OurMetaverseDAO NFT Contract is a smart contract which deploy on [Ethereum](https://etherscan.io/address/0xEcd0D12E21805803f70de03B72B1C162dB0898d9). It's based on ERC721, added some new API for web3 creator economy, perhaps ERC721M can be created in the future.

## Develop

### Parepare

```sh
mv .env.sample .env # and modify it when needed
npm i
```

### Local Develop

```sh
npm run node
npm run compile
npm run deploy:localhost
```

### Run test

```sh
npm test
```

### Deploy to mainnet

```sh
npm run deploy:mainnet
```

### Deploy to rinkeby

```sh
npm run deploy:rinkeby
```

### Verify source code on rinkeby

```sh
npx hardhat verify [your contract address] 'https://our-metaverse.xyz/meta.json#' --network rinkeby
```

### Verify source code on mainnet

```sh
npx hardhat verify [your contract address] 'https://our-metaverse.xyz/meta.json#' --network mainnet
```
