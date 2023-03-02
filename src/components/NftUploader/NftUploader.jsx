import { ethers } from 'ethers';
import React, { useEffect, useState } from "react";
import { Web3Storage } from 'web3.storage';
import { Button } from "@mui/material";

import Web3Mint from '../../utils/Web3Mint.json';
import ImageLogo from "./image.svg";
import "./NftUploader.css";

const NftUploader = () => {
  const [ currentAccount, setCurrentAccount ] = useState('');
  const [ totalMint, setTotalMint ] = useState(null);
  console.log('currentAccount: ', currentAccount);
  const CONTRACT_ADDRESS = '0xA26fc1D061780535cfb0060b5Bf00C4b46a445a3';
  const MAX_MINT = 50;
  const [ isMinting, setIsMinting ] = useState(false);
  
  const checkIfWalletIsConnected = async() => {
    // ユーザーがMetamaskを持っているか確認する
    const { ethereum } = window;
    if(!ethereum){
      console.log('Make sure you have metamask!')
      return;
    }else{
      console.log('We have the ethereum object', ethereum);
    }

    const accounts = await ethereum.request({method: 'eth_accounts'});
    if(accounts.length !== 0){
      const account = accounts[0]
      console.log('Found an authorized account: ', account)
      setCurrentAccount(account);
    }else{
      console.log('No authorized account found');
      return;
    }

    let chainId = await ethereum.request({method: 'eth_chainId'});
    console.log('Connected to chain: ', chainId);
    const goerliChain = '0x5';
    if(chainId !== goerliChain){
      alert('You are not connected to the Goerli test Network')
    }
  };

  const getTotalMint = async() => {
    // if(currentAccount === ''){
    //   console.log('-> no auth')
    //   return;
    // }

    try{
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        Web3Mint.abi,
        provider
      );

      let totalMint = await connectedContract.getTotalMint();
      console.log('totalMint: ', Number(totalMint));
      setTotalMint(Number(totalMint));
    }catch(error){
      console.log(error);
    }
  }

  const connectWallet = async() => {
    try{
      const { ethereum } = window;
      if(!ethereum){
        alert('Get MetaMask');
        return;
      }
      // ウォレットアドレスに対してアクセスをリクエストする
      const accounts = await ethereum.request({method: 'eth_requestAccounts'});
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    }catch(error){
      console.log(error);
    }
  };

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDkzNjQxZURDYTBmZDU1RjQ2QTZBZjk1N2YwMjYyZWYwMUZkYTY5MjgiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Nzc2NzU2MjI0OTksIm5hbWUiOiJ1bmNoYWluLUVUSC1ORlQtTWFrZXIifQ.rovMPMoP3DzdpCqcrBgP76fn65gi58rjhH7LK_azv2U';
  const imageToNFT = async(e) => {
    const client = new Web3Storage({token: API_KEY})
    const image = e.target;
    console.log(image);

    const rootCid = await client.put(image.files, {
      name: 'experiment',
      maxRetries: 3
    });
    console.log('rootCid: ', rootCid);
    const res = await client.get(rootCid)
    console.log('res: ', res)
    const files = await res.files()
    console.log('files: ', files)
    for(const file of files){
      console.log('file.cid: ', file.cid);
      askContractToMintNft(file.cid);
    }
  }

  const checkTokenURI = async() => {
    try{
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        Web3Mint.abi,
        signer
      );
      let uri = await connectedContract.tokenURI(0);
      console.log('token uri 0:');
      console.log(uri)

      uri = await connectedContract.tokenURI(1);
      console.log('token uri 1:');
      console.log(uri)

    }catch(error){
      console.log(error);
    }
  }

  const askContractToMintNft = async(ipfs) => {
    try{
      const { ethereum } = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer
        );
        console.log('Going to pop wallet now to pay gas...');
        setIsMinting(true);
        let nftTxn = await connectedContract.mintIpfsNFT('sample', ipfs);
        console.log('Mining...please wait.');
        await nftTxn.wait();
        console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);
        setIsMinting(false);
      }else{
        console.log("Ethereum object doesn't exist!")
      }
    }catch(error){
      console.log(error);
    }
  }

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className='cta-button connect-wallet-button'>
      Connect to Wallet
    </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
    getTotalMint();
  }, []);

  return (
    <div className="outerBox">
      {currentAccount === ''? (
        renderNotConnectedContainer()
      ):(
        <p>If you choose image, you can mint your NFT</p>
      )}
      <div className="title">
        <h2>NFTアップローダー</h2>
      </div>
      <div className="nftUplodeBox">
        <div className="imageLogoAndText">
          <img src={ImageLogo} alt="imagelogo" />
          <p>ここにドラッグ＆ドロップしてね</p>
        </div>
        {/* multiple: ファイルの複数選択 */}
        <input className="nftUploadInput" multiple name="imageURL" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT} />
      </div>
      <p>または</p>
      <Button variant="contained">
        ファイルを選択
        <input className="nftUploadInput" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT}/>
      </Button>
      <p>Total mint</p>
      <p>{totalMint} / {MAX_MINT}</p>

      {isMinting? (
        <p>Minting now...</p>
      ):(
        <p>select an image to mint as an NFT !!</p>
      )}

      <button onClick={() => askContractToMintNft('bafkreihobilfrtowacowvhhg7qixlqsg73dpyjybnscd7ujyd6ciisjiqm')}>askContractToMintNft</button>
      <button onClick={checkTokenURI}>check token uri</button>
    </div>
  );
};

export default NftUploader;