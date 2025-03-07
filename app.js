async function populateDropdown() {
    try {
        const response = await fetch('https://chainid.network/chains.json');
        const data = await response.json();

        
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


async function fetchABI(abipath) {
    const response = await fetch(abipath);
    return response.json();
}

async function loadContract(abipath,contractaddress){
    const abi = await fetchABI(abipath);
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
    const contractaddress = "0xA6979646c33b39523F5D506A0095B9c220622d63";
    const abipath = 'abi.json'
    await checkAndSwitchNetwork(11155111)
    const startTime = performance.now();
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    window.contract = await loadContract(abipath,contractaddress);
    account = await getCurrentAccount();
    try{
        const metadata = await window.contract.methods.getNFTInfo(hashArray).call();
        displayChainResult(metadata)
    }catch(error){
        alert(error.message)
        const resultDiv = document.getElementById('chainResult');
        resultDiv.innerHTML =`` 
        
    }
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    console.log(`Execution time: ${executionTime} ms`);
}
async function registernft(){
    const contractaddress = "0xA6979646c33b39523F5D506A0095B9c220622d63";
    const abipath = 'abi.json'
    await checkAndSwitchNetwork(11155111)
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    window.contract = await loadContract(abipath,contractaddress);
    account = await getCurrentAccount();
    const selected_chain_id = document.getElementById('chainDropd').value
    const register_CA = document.getElementById('contractAddress').value
    const register_tokenid = document.getElementById('tokenId').value
    console.log(`File Hash (Base58): ${hashArray}\nChain ID: ${selected_chain_id} \nContract Address: ${register_CA}\ntoken ID: ${register_tokenid}`);
    try{
        await window.contract.methods.registerNFT(hashArray, selected_chain_id,register_CA,register_tokenid).send({from:account})
        alert("NFT registered successfully!");
    } catch (error) {
        let errorMessage = "Transaction failed";

        // Check if the error contains custom error information
        if (error.code === "UNPREDICTABLE_GAS_LIMIT" && error.error && error.error.data) {
            const errorData = error.error.data;

            // Check for specific custom error signatures
            if (errorData.includes("InvalidContractAddress")) {
                errorMessage = "Invalid contract address provided.";
            } else if (errorData.includes("FileAlreadyRegistered")) {
                errorMessage = "This file is already registered.";
            } else {
                // Use generic error message if the error is not recognized
                errorMessage = "An unexpected error occurred.";
            }
        }

        // Show the specific error message in an alert
        alert(`Error: ${errorMessage}`);
    }

}
async function getChainInfo(chainId) {
    try {
        const response = await fetch('https://chainid.network/chains.json');
        const data = await response.json();

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

function generateExplorerLinks(explorers, address) {
    return explorers.map(explorer => `
        <li>
            <a href="${explorer.url}/address/${address}" target="_blank"
               class="text-blue-500 hover:underline">
                ${address} (${explorer.name})
            </a>
        </li>
    `).join('');
}

async function displayChainResult(metadata) {
    const chaininfo = await getChainInfo(metadata["0"]);
    const resultDiv = document.getElementById('chainResult');

    if (!chaininfo.name) {
        resultDiv.innerHTML = renderError("Chain not found");
        return;
    }

    resultDiv.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg shadow-md text-white text-center">
            ${renderSection('Chain Name', chaininfo.name, 'blue-400')}
            ${renderSection('Chain ID', metadata["0"], 'gray-300')}
            ${renderSection('Contract', metadata["1"], 'yellow-300', metadata["1"])}
            ${renderExplorers(chaininfo.explorers, metadata["1"])}
            ${renderTokenID(chaininfo, metadata)}
            ${renderOwnerButton(metadata)}
        </div>
    `;
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

// Helper function to dynamically render the owner info
function renderOwnerInfo({ owner, chaininfo, metadataUrl, tokenURI, metadata }) {
    return `
        <div class="max-w-lg mx-auto p-6 bg-gray-800 rounded-lg shadow-md mt-6 text-white">
            ${renderSection('Owner Address', owner, 'blue-400')}
            ${renderExplorers(chaininfo.explorers, owner)}
            ${renderSection('Metadata', metadataUrl, 'green-400', tokenURI)}
        </div>`;
}

// Helper function to render a general section (e.g., Owner, Metadata)
function renderSection(title, content, colorClass, link = null) {
    return `
        <div class="mt-4">
            <h3 class="text-xl font-bold text-${colorClass}">${title}:</h3>
            ${link ? `<a href="${link}" class="text-indigo-400 hover:underline break-all">${content}</a>` 
                  : `<p class="text-lg font-semibold text-gray-300 break-words">${content}</p>`}
        </div>`;
}

// Helper function to render explorers
function renderExplorers(explorers, owner) {
    return `
        <div class="mt-4">
            <h3 class="text-xl font-bold text-yellow-400">Explorers:</h3>
            <ul class="list-disc list-inside text-gray-200">
                ${explorers.map(explorer => `
                    <li>
                        <a href="${explorer.url}/address/${owner}" target="_blank" class="text-blue-400 hover:underline">
                            ${owner} (${explorer.name})
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>`;
}

// Helper function to render tokenID
function renderTokenID(chaininfo, metadata) {
    return renderSection('Token ID', `<a href="${chaininfo.explorers[0].url}/nft/${metadata["1"]}/${metadata["2"]}" class="text-green-400 hover:underline">${metadata["2"]}</a>`, 'green-400');
}

// Helper function to render the button for fetching owner info
function renderOwnerButton(metadata) {
    return `
        <h2 id="ownerOf" class="text-lg font-bold text-purple-400 mt-4"></h2>
        <button onclick="fetchOwnerWithNetworkCheck('${metadata["2"]}', '${metadata["1"]}', ${metadata["0"]})"
                class="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg">
            Get Owner Address
        </button>
    `;
}

// Helper function to render error messages
function renderError({ errorMessage }) {
    return `
        <div class="max-w-lg mx-auto p-6 bg-red-700 text-white rounded-lg shadow-md mt-6 text-center">
            <h2 class="text-2xl font-bold">Error fetching owner or metadata</h2>
            <p class="text-gray-300">${errorMessage}</p>
        </div>`;
}


async function checkAndSwitchNetwork(requiredChainId) {
    if (window.ethereum) {
        try {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            if (parseInt(currentChainId, 16) !== requiredChainId) {
                // Switch to the required network
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + requiredChainId.toString(16) }], // Convert chainId to hex
                    });
                    console.log(`Switched to chain ID ${requiredChainId}`);
                } catch (switchError) {
                    console.error(`Error switching network: ${switchError.message}`);
                    // If the network is not added to MetaMask, request to add it
                    if (switchError.code === 4902) {
                        const chainInfo = await getChainInfo(requiredChainId);
                        if (chainInfo.name) {
                            try {
                                await window.ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [{
                                        chainId: '0x' + requiredChainId.toString(16),
                                        chainName: chainInfo.name,
                                        rpcUrls: [chainInfo.rpc],
                                        nativeCurrency: {
                                            name: chainInfo.nativeCurrency.name,
                                            symbol: chainInfo.nativeCurrency.symbol,
                                            decimals: chainInfo.nativeCurrency.decimals,
                                        },
                                    }],
                                });
                                console.log(`Added and switched to chain ID ${requiredChainId}`);
                            } catch (addError) {
                                console.error(`Error adding network: ${addError.message}`);
                            }
                        }
                    }
                }
            } else {
                console.log(`Already on chain ID ${requiredChainId}`);
            }
        } catch (error) {
            console.error(`Error checking current network: ${error.message}`);
        }
    } else {
        console.error('MetaMask is not installed');
    }
}

async function addNetwork(chainId) {
    try {
        const chainInfo = await getChainInfo(chainId);

        if (!chainInfo.name) {
            console.error('Chain information is not available.');
            return;
        }

        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0x' + chainId.toString(16),
                chainName: chainInfo.name,
                rpcUrls: [chainInfo.rpc],
                nativeCurrency: {
                    name: chainInfo.nativeCurrency.name,
                    symbol: chainInfo.nativeCurrency.symbol,
                    decimals: chainInfo.nativeCurrency.decimals,
                },
                blockExplorerUrls: chainInfo.explorers.map(explorer => explorer.url),
            }],
        });

        console.log(`Network ${chainInfo.name} added successfully`);
    } catch (error) {
        console.error(`Error adding network: ${error.message}`);
    }
}

