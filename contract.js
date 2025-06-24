// contract.js
import { getCurrentAccount } from './wallet.js';
import { renderOwnerInfo, renderError, displayChainResult } from './render.js';
import { getChainInfo, checkAndSwitchNetwork } from './network.js';

async function fetchABI(abipath) {
    const response = await fetch(abipath);
    return response.json();
}

async function loadContract(abipath, contractaddress) {
    const abi = await fetchABI(abipath);
    return new window.web3.eth.Contract(abi, contractaddress);
}

async function verify() {
    const contractaddress = "0xA6979646c33b39523F5D506A0095B9c220622d63";
    const abipath = 'abi.json';
    await checkAndSwitchNetwork(11155111); // Ensure this function is imported
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    window.contract = await loadContract(abipath, contractaddress);
    const account = await getCurrentAccount();
    try {
        const metadata = await window.contract.methods.getNFTInfo(hashArray).call();
        displayChainResult(metadata);
    } catch (error) {
        alert(error.message);
        document.getElementById('chainResult').innerHTML = '';
    }
}

async function registernft() {
    const contractaddress = "0xA6979646c33b39523F5D506A0095B9c220622d63";
    const abipath = 'abi.json';
    await checkAndSwitchNetwork(11155111); // Ensure this function is imported
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    window.contract = await loadContract(abipath, contractaddress);
    const account = await getCurrentAccount();
    const selected_chain_id = document.getElementById('chainDropdown').value;
    const register_CA = document.getElementById('contractAddress').value;
    const register_tokenid = document.getElementById('tokenId').value;
    try {
        await window.contract.methods.registerNFT(hashArray, selected_chain_id, register_CA, register_tokenid).send({ from: account });
        alert("NFT registered successfully!");
    } catch (error) {
        let errorMessage = "Transaction failed";
        if (error.code === "UNPREDICTABLE_GAS_LIMIT" && error.error && error.error.data) {
            const errorData = error.error.data;
            if (errorData.includes("InvalidContractAddress")) {
                errorMessage = "Invalid contract address provided.";
            } else if (errorData.includes("FileAlreadyRegistered")) {
                errorMessage = "This file is already registered.";
            }
        }
        alert(`Error: ${errorMessage}`);
    }
}

async function fetchOwnerWithNetworkCheck(tokenId, contractAddress, requiredChainId) {
    await checkAndSwitchNetwork(requiredChainId); // Ensure we're on the correct network

    const startTime = performance.now();
    const resultDiv = document.getElementById('ownerOf');
    const ownerabi = 'getMetadataABI.json'; // Path to ABI file containing both ownerOf and tokenURI functions
    const contract = await loadContract(ownerabi, contractAddress);

    try {
        // Fetch owner and metadata
        const [owner, tokenURI] = await Promise.all([
            contract.methods.ownerOf(tokenId).call(),
            contract.methods.tokenURI(tokenId).call()
        ]);

        // Get metadata URL
        const metadataUrl = tokenURI.startsWith('ipfs://') 
            ? `https://ipfs.io/ipfs/${tokenURI.substring(7)}` 
            : tokenURI;

        // Fetch metadata
        const metadataResponse = await fetch(metadataUrl);
        const metadata = await metadataResponse.json();

        // Get chain info
        const chaininfo = await getChainInfo(requiredChainId);
        findImageUrl(metadataUrl)
        // Render result dynamically
        resultDiv.innerHTML = renderOwnerInfo({
            owner,
            chaininfo,
            metadataUrl,
            tokenURI,
            metadata
        });

    } catch (error) {
        console.error(`Error fetching owner or metadata: ${error.message}`);
        resultDiv.innerHTML = renderError({ errorMessage: error.message });
    }

    const endTime = performance.now();
    console.log(`Execution time: ${endTime - startTime} ms`);
}

async function findImageUrl(metadataUrl) {
    try {
        // Fetch the JSON data from the metadata URL
        const response = await fetch(metadataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON data
        const metadata = await response.json();

        // Iterate through the key-value pairs to find the image URL
        for (const [key, value] of Object.entries(metadata)) {
            // Check if the value is a string and matches a common image URL pattern
            if (typeof value === 'string' && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(value)) {
                console.log(`Image URL found in key "${key}": ${value}`);
            }
        }

        // If no image URL is found
        console.log('No image URL found in the metadata.');
        return null;

    } catch (error) {
        console.error('Error fetching or parsing the metadata:', error);
        return null;
    }
}

export { fetchABI, loadContract, verify, registernft, fetchOwnerWithNetworkCheck };