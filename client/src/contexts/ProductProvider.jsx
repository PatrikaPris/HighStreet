import React, { createContext, useReducer } from 'react';
// import { McdPlugin } from '@makerdao/dai'; // makerdao is a library that allows for interaction with the DAI coin.
import { ethers } from 'ethers';
import ProductReducer from './ProductReducer';
import kalonCard from '../assets/product1.png';
import loreal from '../assets/product2.png';
import mystery from '../assets/product3.png';
import lvmh from '../assets/product4.png';
import kalonfeature from '../assets/kalon.png';
import lvmhfeature from '../assets/lvmh.png';
import lorealfeature from '../assets/loreal.png';
import randomfeature from '../assets/randomfeature.png';
// abstract bridge interface for solidity
import Token from '../build/contracts/ProductToken.json';
import Factory from '../build/contracts/TokenFactory.json';
import Dai from '../build/contracts/DaiMock.json';

// class level variables that store much needed handles
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner(); // this is the account that user uses to make payment.
let factoryContract; // this handle is used to call view functions from the smart contract.
// let factoryContractWSigner;  // this handle is used to call state-changing functions from the smart contract.
let daiAddress; // this is the address for Dai tokens, it is pre-defined based on which network user is connected to.
let daiContract;
let daiContractWSigner;
// function that initialize the solidity smart contract handles
// async fu nction initializeNetwork() {
provider.getNetwork().then((result) => {
  console.log(`Network Retrieved: ${result}`);
  const networkId = result.chainId;
  console.log(`Network ID: ${networkId}`);
  switch (networkId) {
    case '1': // This is for Main Net
      daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
      break;
    case '42': // This is for Kovan Test Net
      daiAddress = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa';
      break;
    default:
      daiAddress = '';
  }
  daiContract = new ethers.Contract(daiAddress, Dai.abi, provider);
  daiContractWSigner = daiContract.connect(signer);
  const networkData = Factory.networks[networkId];
  if (networkData) {
    console.log('Ready to connect to contract.');
    factoryContract = new ethers.Contract(networkData.address, Factory.abi, provider);
    // factoryContractWSigner = factoryContract.connect(signer);
  } else {
    console.log("Contract wasn't deployed properly.");
  }
}).catch((e) => {
  console.log(e);
});
// }

let tokenAddress;
let token; // this is the token handle for a particular token user is interested.
// for the following functions, I assume that token has been set accordingly.
let tokenWSigner; // again, this is the token handle that is required to make any state changing method calls
// const maker = Maker.create('test');

// await maker.authenticate();
// const tokenService = maker.service('token');
// const dai = tokenService.getToken('DAI');

// This function retrieve the address of a token by its name.
// then it creates a token handle with
async function retrieveTokenByName(name) {
  await factoryContract.retrieveToken(name).then((result) => {
    tokenAddress = result;
    token = new ethers.Contract(tokenAddress, Token.abi, provider);
    tokenWSigner = token.connect(signer);
  }).catch((e) => {
    console.log(e);
  });
}

async function getAvailability() {
  return token.getAvailability();
}

async function getPrice() {
  return token.getCurrentPrice();
}

async function getPriceForN(tokens) { // token must be a number that's smaller than 2^32 - 1
  return token.getPriceForN(tokens);
}

async function buy(cashUpperBound) { // purchase tokens based on a cash upper bound
  // need to implment DAI handle
  // Dai handle then needs to approve the above amount to be withdrawn
  // here we assume that cashUpperBound has already been parsed to 18 decimals
  await daiContractWSigner.approve(tokenAddress, cashUpperBound).then(async () => {
    token.buy(cashUpperBound);
  }).catch((e) => {
    console.log(e);
  });
}

async function sell(tokenAmount) { // token must be a number that's smaller than 2^32 - 1
  await token.sell(tokenAmount);
}

async function tradeIn(tokenAmount) { // token must be a number that's smaller than 2^32 - 1
  await token.tradein(tokenAmount);
}

// import ProductToken.sol
// Initial Placeholder
const initialState = {
  products: [
    {
      name: 'Kalon Tea',
      ticker: 'KLT',
      price: 12,
      supply: 500, // tokenInstance.getSupply()
      available: 500, // tokenInstance.getAvailability()
      img: kalonCard,
      tagline: 'Essence of Nature',
      blurb: "Nature's first green is gold, infused in a liquor that will make it truly last forever",
      feature: kalonfeature
    },
    {
      name: "L'Oréal ",
      ticker: 'OREAL',
      price: 20,
      supply: 2500, // etc.
      available: 2500,
      img: loreal,
      tagline: "Because you're worth it ",
      blurb: "Be the star that you were always meant to be, L'oreal, because you're worth it",
      feature: lorealfeature
    },
    {
      name: 'Mystery Box',
      ticker: 'RAND',
      price: 15,
      supply: 1000,
      available: 1000,
      img: mystery,
      tagline: 'Try Me',
      blurb: 'buy me for the chance to redeem anything in our entire catalog',
      feature: randomfeature
    },
    {
      name: 'LVMH',
      ticker: 'LVMH',
      price: 122,
      supply: 3000,
      available: 3000,
      img: lvmh,
      tagline: 'Making it Real',
      blurb: 'A timeless first and a vibrant way to touch up both your digital and IRL identity',
      feature: lvmhfeature
    }
  ]
};

// Create Context
const ProductContext = createContext(initialState);

// Provider Component
const ProductProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ProductReducer, initialState);

  // Actions
  async function tokenBought(selectedToken) {
    // await initializeNetwork();
    const a = await retrieveTokenByName('Kalon Tea');
    await getAvailability(a).then((result) => {
      console.log(`Availibility of token: ${result}`);
    }).catch((e) => {
      console.log(e);
    });

    dispatch({
      type: 'TOKEN_BOUGHT',
      payload: selectedToken
    });
  }

  function tokenSold(product) {
    dispatch({
      type: 'TOKEN_SOLD',
      payload: product
    });
  }

  function tokenRedeemed(product) {
    dispatch({
      type: 'TOKEN_REDEEMED',
      payload: product
    });
  }

  return (
    <ProductContext.Provider value={{
      products: state.products, tokenBought, tokenSold, tokenRedeemed
    }}
    >
      {children}
    </ProductContext.Provider>
  );
};

ProductProvider.context = ProductContext;

export default ProductProvider;
