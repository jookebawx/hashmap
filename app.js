// app.js
import { connectMetaMask, getCurrentAccount } from './wallet.js';
import { verify, registernft } from './contract.js';
import { getChainInfo, checkAndSwitchNetwork } from './network.js';
import { displayChainResult } from './render.js';

// Populate the chain dropdown
async function populateDropdown() {
    try {
        const response = await fetch('https://chainid.network/chains.json');
        const data = await response.json();
        const dropdown = document.getElementById('chainDropdown');
        dropdown.innerHTML = '';
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

// Expose functions to the global scope for HTML event handlers
window.connectMetaMask = connectMetaMask;
window.verify = verify;
window.registernft = registernft;