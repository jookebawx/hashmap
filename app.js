// app.js
import { connectMetaMask, getCurrentAccount } from './wallet.js';
import { verify, registernft, fetchOwnerWithNetworkCheck } from './contract.js';
import { getChainInfo, checkAndSwitchNetwork } from './network.js';
import { displayChainResult } from './render.js';

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


function previewFile() {
    const fileInput = document.getElementById('fileToUpload');
    const files = fileInput.files;
    const filePreview = document.getElementById('filePreview');

    filePreview.innerHTML = ''; // Clear previous preview

    if (!files || files.length === 0) {
        return;
    }

    Array.from(files).forEach(file => {
        const fileURL = URL.createObjectURL(file);

        // Create a container for each file preview
        const section = document.createElement('div');
        section.classList.add('mb-6');

        const label = document.createElement('p');
        label.textContent = `📄 ${file.webkitRelativePath || file.name}`;
        label.classList.add('text-sm', 'mb-2', 'text-gray-300');
        section.appendChild(label);

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = fileURL;
            img.alt = "Image Preview";
            img.classList.add('max-w-full', 'max-h-64', 'rounded-lg', 'shadow-md');
            section.appendChild(img);

        } else if (file.type === 'application/pdf') {
            const embed = document.createElement('embed');
            embed.src = fileURL;
            embed.type = 'application/pdf';
            embed.classList.add('w-full', 'h-96', 'rounded-lg', 'shadow-md');
            section.appendChild(embed);

        } else if (file.type.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = fileURL;
            audio.classList.add('w-full', 'mt-2');
            section.appendChild(audio);

        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.controls = true;
            video.src = fileURL;
            video.classList.add('w-full', 'h-auto', 'rounded-lg', 'shadow-md', 'mt-2');
            section.appendChild(video);

        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.log')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const pre = document.createElement('pre');
                pre.textContent = event.target.result;
                pre.classList.add('bg-gray-800', 'p-4', 'rounded-lg', 'text-white', 'text-left', 'overflow-auto', 'max-h-60');
                section.appendChild(pre);
            };
            reader.readAsText(file);

        } else {
            const msg = document.createElement('p');
            msg.textContent = 'This file type cannot be previewed.';
            msg.classList.add('text-gray-400', 'italic');
            section.appendChild(msg);
        }

        filePreview.appendChild(section);
    });
}


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