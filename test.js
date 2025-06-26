import React, { useState } from "react";

// Include Web3 and Ethers
import Web3 from "web3";
import { ethers } from "ethers";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [chainResult, setChainResult] = useState(null);
  const [openseaResult, setOpenSeaResult] = useState(null);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedChain, setSelectedChain] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [tokenId, setTokenId] = useState('');

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        setIsMetaMaskConnected(true);
      } catch (error) {
        console.error("User denied MetaMask access");
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  const verify = () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    // Logic to verify the file (you can expand on this depending on your logic)
    console.log("File verified:", file);
  };

  const registernft = async () => {
    if (!contractAddress || !tokenId || !selectedChain) {
      alert("Please fill in all fields.");
      return;
    }

    // Logic to register the NFT (you can connect to smart contracts here)
    console.log("Registering NFT with contract:", contractAddress, "Token ID:", tokenId, "on Chain:", selectedChain);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleChainChange = (event) => {
    setSelectedChain(event.target.value);
  };

  return (
    <div>
      <button onClick={connectMetaMask}>Connect MetaMask</button>

      {walletAddress && (
        <div id="walletAddress">
          <p><strong>Connected Wallet Address:</strong> <span>{walletAddress}</span></p>
        </div>
      )}

      {isMetaMaskConnected && (
        <div id="upload">
          <h1>Upload File</h1>
          <form id="uploadForm">
            <input type="file" name="fileToUpload" id="fileToUpload" onChange={handleFileChange} />
            <button type="button" onClick={verify}>Verify</button>
          </form>
        </div>
      )}

      {chainResult && (
        <div id="chainResult">
          {/* Display chain result */}
          <p>{chainResult}</p>
        </div>
      )}

      {openseaResult && (
        <div id="openseaResult">
          {/* Display OpenSea result */}
          <p>{openseaResult}</p>
        </div>
      )}

      <div id="check" style={{ display: isMetaMaskConnected ? 'block' : 'none' }}>
        <h1>Register your NFT</h1>
        <form id="RegisterNFT">
          <label htmlFor="chainID">Blockchain Network:</label>
          <select
            id="chainDropdown"
            value={selectedChain}
            onChange={handleChainChange}
          >
            <option value="">Select Chain</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="binance-smart-chain">Binance Smart Chain</option>
            {/* Add more chains as needed */}
          </select>
          <br />
          <label htmlFor="contractAddress">Contract Address:</label>
          <input
            type="text"
            id="contractAddress"
            name="contractAddress"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            required
          />
          <br />
          <label htmlFor="tokenId">Token ID:</label>
          <input
            type="number"
            id="tokenId"
            name="tokenId"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            required
          />
          <br />
          <button type="button" onClick={registernft}>Register</button>
        </form>
      </div>
    </div>
  );
}

export default App;
