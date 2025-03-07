// contract.js
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
    await checkAndSwitchNetwork(11155111);
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
    await checkAndSwitchNetwork(11155111);
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

export { fetchABI, loadContract, verify, registernft };