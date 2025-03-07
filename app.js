// app.js
import { connectMetaMask, getCurrentAccount } from './wallet.js';
import { verify, registernft, fetchOwnerWithNetworkCheck } from './contract.js';
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

function previewFile() {
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];
    const filePreview = document.getElementById('filePreview');

    if (!file) {
        filePreview.innerHTML = ''; // Clear preview if no file is selected
        return;
    }

    filePreview.innerHTML = ''; // Clear previous preview

    if (file.type.startsWith('image/')) {
        // Preview for images
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = "File Preview";
        img.classList.add('max-w-full', 'max-h-full', 'object-contain', 'rounded-lg', 'shadow-md');
        
        // Create a container for the image
        const container = document.createElement('div');
        container.classList.add('w-[500px]', 'h-[500px]', 'flex', 'items-center', 'justify-center', 'border', 'border-gray-700', 'rounded-lg', 'overflow-hidden');
        container.appendChild(img);
        
        filePreview.appendChild(container);
    } else if (file.type === 'application/pdf') {
        // Preview for PDFs
        const embed = document.createElement('embed');
        embed.src = URL.createObjectURL(file);
        embed.type = 'application/pdf';
        embed.classList.add('w-full', 'h-96', 'rounded-lg', 'shadow-md');
        filePreview.appendChild(embed);
    } else {
        // Preview for other file types (e.g., text files)
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const pre = document.createElement('pre');
            pre.textContent = text;
            pre.classList.add('bg-gray-800', 'p-4', 'rounded-lg', 'text-white', 'text-left', 'overflow-auto');
            filePreview.appendChild(pre);
        };
        reader.readAsText(file);
    }
}

populateDropdown();

// Expose functions to the global scope for HTML event handlers
window.connectMetaMask = connectMetaMask;
window.verify = verify;
window.registernft = registernft;
window.fetchOwnerWithNetworkCheck = fetchOwnerWithNetworkCheck; // Expose this function
window.displayChainResult = displayChainResult;
window.getChainInfo = getChainInfo;
window.checkAndSwitchNetwork=checkAndSwitchNetwork;
window.previewFile = previewFile;