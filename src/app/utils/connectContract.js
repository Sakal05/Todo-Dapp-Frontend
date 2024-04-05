'use client';

import { ethers } from 'ethers';

function connectContract(contractAddress, contractABI) {
  let Contract;
  let Provider;
  let signer;
  try {
    const { ethereum } = window;
    //= checking for eth object in the window
    if (ethereum) {
      Provider = new ethers.providers.Web3Provider(ethereum);
      Provider.send("eth_requestAccounts", [])
      signer = Provider.getSigner();
      // instantiating new connection to the contract
      Contract = new ethers.Contract(contractAddress, contractABI, signer);
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log('ERROR:', error);
  }
  
  return { Contract, Provider, signer };
}

export default connectContract;