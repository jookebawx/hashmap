// app.js
import { connectMetaMask, getCurrentAccount } from './wallet.js';
import { verify, registernft, fetchOwnerWithNetworkCheck } from './contract.js';
import { getChainInfo, checkAndSwitchNetwork } from './network.js';
import { displayChainResult } from './render.js';
import { generateImageHashes } from './imageHashing.js';

async function openChainListPopup() {
    try {
        const response = await fetch('https://chainid.network/chains.json');
        const chains = await response.json();

        const popup = window.open('', 'ChainList', 'width=600,height=600');

        popup.document.write(`
            <html>
                <head>
                    <title>Chain ID Reference</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; background-color: #111; color: #eee; }
                        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                        th, td { padding: 8px 12px; border-bottom: 1px solid #555; text-align: left; }
                        th { background-color: #222; }
                        button { padding: 4px 8px; background-color: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; }
                        button:hover { background-color: #4338ca; }
                    </style>
                </head>
                <body>
                    <h2>Supported Blockchain Networks</h2>
                    <table>
                        <tr><th>Chain ID</th><th>Network Name</th><th>Short Name</th><th>Select</th></tr>
                        ${chains.map(chain => `
                            <tr>
                                <td>${chain.chainId}</td>
                                <td>${chain.name}</td>
                                <td>${chain.shortName || '-'}</td>
                                <td>
                                    <button onclick="selectChain(${chain.chainId})">Select</button>
                                </td>
                            </tr>
                        `).join('')}
                    </table>

                    <script>
                        function selectChain(chainId) {
                            if (window.opener && !window.opener.closed) {
                                const input = window.opener.document.getElementById('chainID');
                                if (input) {
                                    input.value = chainId;
                                    window.close();
                                } else {
                                    alert('Chain ID input field not found in the main window.');
                                }
                            } else {
                                alert('Main window is not accessible.');
                            }
                        }
                    </script>
                </body>
            </html>
        `);
        popup.document.close();
    } catch (error) {
        alert('Failed to fetch chain list. Please try again later.');
        console.error(error);
    }
}

function wrapAndAppend(section, element) {
    const wrapper = document.createElement('div');
    wrapper.classList.add(
        'flex', 'justify-center', 'items-center', 'border', 'border-gray-700',
        'rounded-lg', 'overflow-hidden', 'p-4', 'bg-gray-900'
    );
    wrapper.appendChild(element);
    section.appendChild(wrapper);
}

function previewFile() {
    const fileInput = document.getElementById('fileToUpload');
    const files = fileInput.files;
    const filePreview = document.getElementById('filePreview');
    const generateBtn = document.getElementById('generateHashesButton');

    filePreview.innerHTML = ''; // Clear previous preview

    if (!files || files.length === 0) return;
    let showHashButton = false;
    Array.from(files).forEach(file => {
        const fileURL = URL.createObjectURL(file);

        const section = document.createElement('div');
        section.classList.add('mb-6');

        const label = document.createElement('p');
        label.textContent = `📄 ${file.webkitRelativePath || file.name}`;
        label.classList.add('text-sm', 'mb-2', 'text-gray-300');
        section.appendChild(label);

        let previewElement = null;

        if (file.type.startsWith('image/')) {
            showHashButton = true;
            previewElement = document.createElement('img');
            previewElement.src = fileURL;
            previewElement.alt = "Image Preview";
            previewElement.classList.add('max-w-full', 'max-h-64', 'rounded-lg', 'shadow-md');

        } else if (file.type === 'application/pdf') {
            previewElement = document.createElement('embed');
            previewElement.src = fileURL;
            previewElement.type = 'application/pdf';
            previewElement.classList.add('w-full', 'h-96', 'rounded-lg', 'shadow-md');

        } else if (file.type.startsWith('audio/')) {
            previewElement = document.createElement('audio');
            previewElement.controls = true;
            previewElement.src = fileURL;
            previewElement.classList.add('w-full', 'mt-2');

        } else if (file.type.startsWith('video/')) {
            previewElement = document.createElement('video');
            previewElement.controls = true;
            previewElement.src = fileURL;
            previewElement.classList.add('w-full', 'h-auto', 'rounded-lg', 'shadow-md', 'mt-2');

        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.log')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewElement = document.createElement('pre');
                previewElement.textContent = event.target.result;
                previewElement.classList.add('bg-gray-800', 'p-4', 'rounded-lg', 'text-white', 'text-left', 'overflow-auto', 'max-h-60');
                wrapAndAppend(section, previewElement);
                filePreview.appendChild(section);
            };
            reader.readAsText(file);
            return; // early return to wait for async read
        }

        if (previewElement) {
            wrapAndAppend(section, previewElement);
        } else {
            const msg = document.createElement('p');
            msg.textContent = 'This file type cannot be previewed.';
            msg.classList.add('text-gray-400', 'italic');
            section.appendChild(msg);
        }

        filePreview.appendChild(section);
    });
    if (showHashButton) {
        generateBtn.classList.remove('hidden');
    }
}

function addCustomField() {
    const container = document.getElementById('customFields');

    const fieldGroup = document.createElement('div');
    fieldGroup.classList.add('flex', 'space-x-2', 'items-center');

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.placeholder = 'Key';
    keyInput.classList.add('flex-1', 'p-2', 'rounded-lg', 'bg-gray-700', 'text-white');

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'Value';
    valueInput.classList.add('flex-1', 'p-2', 'rounded-lg', 'bg-gray-700', 'text-white');

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.classList.add('text-red-400', 'hover:text-red-600', 'font-bold');
    removeBtn.onclick = () => container.removeChild(fieldGroup);

    fieldGroup.appendChild(keyInput);
    fieldGroup.appendChild(valueInput);
    fieldGroup.appendChild(removeBtn);

    container.appendChild(fieldGroup);
}

window.handleGenerateHashesClick = async function () {
    const fileInput = document.getElementById('fileToUpload');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image file first.");
        return;
    }

    const button = document.getElementById('generateHashesButton');
    button.disabled = true;
    button.textContent = "✅ Hashes Generated";
    button.classList.add('opacity-50', 'cursor-not-allowed');

    await generateImageHashes(file);
};

document.getElementById('fileToUpload').addEventListener('change', () => {
    const button = document.getElementById('generateHashesButton');
    if (button) {
        button.disabled = false;
        button.textContent = "Generate Image Hashes";
        button.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // ❌ Remove previous hash output
    const existing = document.getElementById('imageHashOutput');
    if (existing) existing.remove();

    // ✅ Reset other register-related input fields
    document.getElementById('contractAddress').value = '';
    document.getElementById('tokenId').value = '';
    document.getElementById('chainID').value = '';

    // ✅ Clear custom metadata fields
    const customFields = document.getElementById('customFields');
    if (customFields) customFields.innerHTML = '';
});



// Expose functions to the global scope for HTML event handlers
window.connectMetaMask = connectMetaMask;
window.verify = verify;
window.registernft = registernft;
window.fetchOwnerWithNetworkCheck = fetchOwnerWithNetworkCheck; // Expose this function
window.displayChainResult = displayChainResult;
window.getChainInfo = getChainInfo;
window.checkAndSwitchNetwork=checkAndSwitchNetwork;
window.previewFile = previewFile;
window.openChainListPopup = openChainListPopup;
window.addCustomField = addCustomField;
window.generateImageHashes = generateImageHashes