


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

async function displayChainResult(metadata) {
    const chaininfo = await getChainInfo(metadata["0"]);
    const resultDiv = document.getElementById('chainResult');
    
    if (chaininfo.name) {
        resultDiv.innerHTML = `<h2>Chain Name: ${chaininfo.name}</h2>
                               <h2>Chain ID: ${metadata["0"]}</h2>
                               <h2>Contract Address: ${metadata["1"]}</h2>
                               <h3>Explorers:</h3>
                               <ul>${chaininfo.explorers.map(explorer => `<li><a href="${explorer.url}/address/${metadata["1"]}" target="_blank">${metadata["1"]} (${explorer.name})</a></li>`).join('')}</ul>
                               <h2>Token ID: <a href ="${chaininfo.explorers[0].url}/nft/${metadata["1"]}/${metadata["2"]}">${metadata["2"]}</a></h2>
                               <h2 id="ownerOf"></h2>
                              <button type="button" onclick="fetchOwnerWithNetworkCheck('${metadata["2"]}', '${metadata["1"]}', ${metadata["0"]})">Get Owner Address</button>`;
    } else {
        resultDiv.innerHTML = `<h2>Chain not found</h2>`;
    }
}


async function fetchOwnerWithNetworkCheck(tokenId, contractAddress, requiredChainId) {
    await checkAndSwitchNetwork(requiredChainId); // Ensure we're on the correct network
    const chaininfo = await getChainInfo(requiredChainId);
    const resultDiv = document.getElementById('ownerOf');
    const ownerabi = 'getMetadataABI.json'; // Path to ABI file containing both ownerOf and tokenURI functions
    const contract = await loadContract(ownerabi, contractAddress);

    try {
        // Fetch owner
        const owner = await contract.methods.ownerOf(tokenId).call();

        // Fetch token URI
        const tokenURI = await contract.methods.tokenURI(tokenId).call();

        // Fetch metadata from token URI
        if (tokenURI.startsWith('ipfs://')) {
            metadataUrl = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
        }else{
            metadataUrl = tokenURI;
        }
        const data = await fetch(metadataUrl);
        const response = data.json();   
        console.log(response)
        // Display owner and metadata
        resultDiv.innerHTML = `Owner Address: ${owner}
                               <h3>Explorers:</h3>
                               <ul>${chaininfo.explorers.map(explorer => `<li><a href="${explorer.url}/address/${owner}" target="_blank">${owner}(${explorer.name})</a></li>`).join('')}</ul>
                               <h3>Metadata:<a href = "${metadataUrl}">${tokenURI}</a></h3>`;
                        
    } catch (error) {
        console.error(`Error fetching owner or metadata: ${error.message}`);
        resultDiv.innerHTML = `Error fetching owner or metadata: ${error.message}`;
    }
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

