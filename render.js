// render.js
function renderSection(title, content, colorClass, link = null) {
    return `
        <div class="mt-4">
            <h3 class="text-xl font-bold text-${colorClass}">${title}:</h3>
            ${link ? `<a href="${link}" class="text-indigo-400 hover:underline break-all">${content}</a>` 
                  : `<p class="text-lg font-semibold text-gray-300 break-words">${content}</p>`}
        </div>`;
}

function renderExplorers(explorers, address) {
    return `
        <div class="mt-4">
            <h3 class="text-xl font-bold text-yellow-400">Explorers:</h3>
            <ul class="list-disc list-inside text-gray-200">
                ${explorers.map(explorer => `
                    <li class="mb-2">
                        <a href="${explorer.url}/address/${address}" target="_blank"
                           class="text-blue-400 hover:text-blue-500 hover:underline transition-all duration-300">
                            ${explorer.name}: <span class="text-gray-300 break-all">${address}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>`;
}

function renderTokenID(chaininfo, metadata) {
    return renderSection('Token ID', `<a href="${chaininfo.explorers[0].url}/nft/${metadata["1"]}/${metadata["2"]}" class="text-green-400 hover:underline">${metadata["2"]}</a>`, 'green-400');
}

function renderOwnerButton(metadata) {
    return `
        <h2 id="ownerOf" class="text-lg font-bold text-purple-400 mt-4"></h2>
        <button onclick="fetchOwnerWithNetworkCheck('${metadata["2"]}', '${metadata["1"]}', ${metadata["0"]})"
                class="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">
            Get Owner Address
        </button>
    `;
}

function renderOwnerInfo({ owner, chaininfo, metadataUrl, tokenURI, metadata }) {
    return `
        <div class="max-w-lg mx-auto p-6 bg-gray-800 rounded-lg shadow-md mt-6 text-white">
            ${renderSection('Owner Address', owner, 'blue-400')}
            ${renderExplorers(chaininfo.explorers, owner)}
            ${renderSection('Metadata', tokenURI, 'green-400', metadataUrl)}
        </div>`;
}

function renderError(errorMessage) {
    return `
        <div class="max-w-lg mx-auto p-6 bg-red-700 text-white rounded-lg shadow-md mt-6 text-center">
            <h2 class="text-2xl font-bold">Error fetching owner or metadata</h2>
            <p class="text-gray-300">${errorMessage}</p>
        </div>`;
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
            ${renderSection('Contract', metadata["1"], 'yellow-300')}
            ${renderExplorers(chaininfo.explorers, metadata["1"])}
            ${renderTokenID(chaininfo, metadata)}
            ${renderOwnerButton(metadata)}
        </div>
    `;
}

export { renderSection, renderExplorers, renderTokenID, renderOwnerButton, renderError, renderOwnerInfo, displayChainResult };