


async function populateDropdown() {
    try {
        const data = await fetch('selected_chains.json);

        
        const dropdown = document.getElementById('chainDropdown');
        dropdown.innerHTML = ''; // Clear any existing options
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.chainId;
            option.textContent = item.name;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
}

populateDropdown();
const contractaddress = "0xA6979646c33b39523F5D506A0095B9c220622d63";

async function fetchABI() {
    const response = await fetch('abi.json');
    return response.json();
}

async function loadContract(){
    const abi = await fetchABI();
    return await new window.web3.eth.Contract(abi,contractaddress);
}
async function connectMetaMask() {
    if (window.ethereum) {
        try {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
            const account = await getCurrentAccount();
            if (account) {
                document.getElementById('walletAddress').style.display = 'block';
                document.getElementById('address').textContent = account;
                document.getElementById('upload').style.display = 'block';
                document.getElementById('check').style.display = 'block';
            } else {
                alert('MetaMask account not found.');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to MetaMask. Please check your MetaMask setup.');
        }
    } else {
        alert('MetaMask extension not detected. Please install MetaMask and try again.');
    }
}

async function getCurrentAccount() {
        const accounts = await window.web3.eth.getAccounts();
        return accounts[0];
    }



async function verify() {
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    window.contract = await loadContract();
    account = await getCurrentAccount();
    try{
        const metadata = await window.contract.methods.getNFTInfo(hashArray).call();
        displayChainResult(metadata)
    }catch(error){
        alert(error.message)
        const resultDiv = document.getElementById('chainResult');
        resultDiv.innerHTML =`` 
        
    }
}
async function registernft(){
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    window.contract = await loadContract();
    account = await getCurrentAccount();
    const selected_chain_id = document.getElementById('chainDropdown').value
    const register_CA = document.getElementById('contractAddress').value
    const register_tokenid = document.getElementById('tokenId').value
    console.log(`File Hash (Base58): ${hashArray}\nChain ID: ${selected_chain_id} \nContract Address: ${register_CA}\ntoken ID: ${register_tokenid}`);

    await window.contract.methods.registerNFT(hashArray, selected_chain_id,register_CA,register_tokenid).send({from:account})

}
async function getChainInfo(chainId) {
    try {
        const data = await fetch('selected_chains.json');

        // Find the chain with the specified chainId
        const chain = data.find(chain => chain.chainId == chainId); // Use == to compare string and number

        if (chain) {
            const name = chain.name;
            const explorers = chain.explorers ? chain.explorers.map(explorer => explorer) : [];
            return {name,explorers};
        } else {
            return{ name: null, explorers: [] };
        }
    } catch (error) {
        console.error('Error fetching chain info:', error);
        return{ name: null, explorers: [] };
    }
}

async function displayChainResult(metadata) {
    const chaininfo = await getChainInfo(metadata["0"])
    const resultDiv = document.getElementById('chainResult');
    if (chaininfo.name) {
        resultDiv.innerHTML = `<h2>Chain Name: ${chaininfo.name}</h2>
                               <h2>Chain ID: ${metadata["0"]}</h2>
                               <h2>Contract Address: ${metadata["1"]}</h2>
                               <h3>Explorers:</h3>
                               <ul>${chaininfo.explorers.map(explorer => `<li><a href="${explorer.url}/address/${metadata["1"]}" target="_blank">${metadata["1"]}(${explorer.name})</a></li>`).join('')}</ul>
                               <h2>Token ID: <a href ="https://opensea.io/assets/${chaininfo.name}/${metadata["1"]}/${metadata["2"]}">${metadata["2"]}</a></h2>`
;
    } else {
        resultDiv.innerHTML = `<h2>Chain not found</h2>`;
    }
}

