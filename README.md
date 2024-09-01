# Hashmap NFT Registry Application

This project includes a smart contract and a web application for managing NFTs. The smart contract (`test.sol`) handles the registration and retrieval of NFT information, while the web application (`test.html` and `app.js`) provides an interface for interacting with the contract and managing NFTs. The ABI file (`abi.json`) defines the contract's interface for interaction.

## Overview

- **Smart Contract**: `test.sol` - A Solidity contract for registering and querying NFTs.
- **Web Application**: `test.html` - The HTML interface for interacting with the smart contract.
- **JavaScript**: `app.js` - The script for handling blockchain interactions and UI updates.
- **ABI**: `abi.json` - The ABI file for the smart contract interaction.

## Prerequisites

- [Node.js](https://nodejs.org/) (for running a local development server if needed)
- [MetaMask](https://metamask.io/) (for interacting with the Ethereum blockchain)

## Getting Started

### 1. Smart Contract

The `test.sol` contract allows for registering NFTs with the following functions:

- **Events**:
  - `NFTRegistered(bytes32 filehash, uint256 chainid, address contractAddress, uint256 tokenid)`: Emitted when an NFT is registered.

- **Functions**:
  - `registerNFT(bytes32 filehash, uint256 chain, address contractAddress, uint256 tokenid)`: Registers an NFT with the given parameters.
  - `getNFTInfo(bytes32 filehash)`: Retrieves the NFT information based on the file hash.
  - `isContractRegistered(bytes32 filehash)`: Checks if the contract associated with the file hash is registered.

**Deployment**: Compile and deploy the `test.sol` contract using tools like [Remix](https://remix.ethereum.org/) or [Truffle](https://www.trufflesuite.com/truffle).

### 2. Web Application

**HTML File**: `test.html`

This file provides the user interface for interacting with the smart contract. It includes:
- A button to connect MetaMask.
- Forms for uploading documents, verifying NFTs, and registering NFTs.
- Sections to display chain information and OpenSea listings.

**JavaScript File**: `app.js`

This script handles:
- Connecting to MetaMask and fetching the current account.
- Verifying uploaded files by computing their SHA-256 hash and checking it against the smart contract.
- Registering NFTs with the contract.
- Fetching and displaying blockchain and NFT information.

### 3. ABI File

**ABI File**: `abi.json`

This JSON file provides the ABI (Application Binary Interface) for the smart contract, enabling interaction with the contract’s functions and events. The ABI includes:

- **Events**:
  - `NFTRegistered(bytes32 filehash, uint256 chainid, address contractAddress, uint256 tokenid)`

- **Functions**:
  - `registerNFT(bytes32 filehash, uint256 chain, address contractAddress, uint256 tokenid)`
  - `getNFTInfo(bytes32 filehash)`
  - `isContractRegistered(bytes32 filehash)`

### Setup and Usage

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/your-repo/hashmap.git
    cd hashmap
    ```

2. **Install Dependencies**:

    Make sure you have `web3` and `ethers` libraries included in your HTML file. These are fetched from CDNs in the `test.html` file.

3. **Deploy the Smart Contract**:

    Compile and deploy `test.sol` using your preferred Ethereum development environment.

4. **Run the Web Application**:

    Open `test.html` in a web browser. Ensure MetaMask is installed and configured.

5. **Interact with the Contract**:

    - **Connect MetaMask**: Click the "Connect MetaMask" button to connect your wallet.
    - **Upload Document**: Choose a file and click "Verify" to check if it's registered.
    - **Register NFT**: Fill in the blockchain network, contract address, and token ID to register an NFT.

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make changes and commit them (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a Pull Request.

For detailed contribution guidelines, refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please open an issue on [GitHub](https://github.com/your-repo/hashmap/issues).
