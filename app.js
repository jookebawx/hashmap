// app.js
import { connectMetaMask} from './wallet.js';
import { verify, registernft, fetchOwnerWithNetworkCheck } from './contract.js';
import { getChainInfo, checkAndSwitchNetwork } from './network.js';
import { displayChainResult } from './render.js';

// app.js
async function openChainListPopup() {
  try {
    const res = await fetch('https://chainid.network/chains.json');
    const chains = await res.json();

    const popup = window.open('', 'ChainList', 'width=720,height=680');
    if (!popup) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Chain ID Reference</title>
          <meta charset="utf-8" />
          <style>
            :root { color-scheme: dark; }
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 16px; background:#111; color:#eee; }
            .row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
            .search { flex:1; padding:8px 10px; border-radius:8px; border:1px solid #444; background:#1a1a1a; color:#eee; }
            .btn { padding:6px 10px; background:#4f46e5; color:#fff; border:none; border-radius:8px; cursor:pointer; }
            .btn:hover { background:#4338ca; }
            .btn-ghost { background:#222; }
            .btn-ghost:hover { background:#2a2a2a; }
            table { width:100%; border-collapse:collapse; margin-top:12px; }
            th,td { padding:10px; border-bottom:1px solid #333; text-align:left; }
            th button { background:none; border:none; color:#9aa7ff; cursor:pointer; font-weight:600; }
            .tag { font-size:12px; padding:2px 6px; background:#2b2b2b; border:1px solid #3a3a3a; border-radius:999px; }
            .muted { color:#bbb; }
          </style>
        </head>
        <body>
          <h2>Supported Blockchain Networks</h2>
          <div class="row" style="margin-top:8px;">
            <input id="q" class="search" placeholder="Search by name / short name / chain ID…" />
            <button id="sortId" class="btn-ghost btn">Sort: Chain ID</button>
            <button id="sortName" class="btn-ghost btn">Sort: Name</button>
          </div>

          <table>
            <thead>
              <tr>
                <th><button id="sortId2">Chain&nbsp;ID ⬍</button></th>
                <th><button id="sortName2">Network&nbsp;Name ⬍</button></th>
                <th>Short</th>
                <th>Currency</th>
                <th>Tags</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>

          <script>
            const raw = ${JSON.stringify(chains)};
            let sortKey = 'chainId'; // 'chainId' | 'name'
            let sortDir = 1;         // 1 asc, -1 desc
            const by = (k) => (a,b) => (a[k] ?? '').toString().localeCompare((b[k] ?? '').toString(), undefined, {numeric:true}) * sortDir;

            function norm(s){ return (s||'').toString().toLowerCase(); }
            function isTestnet(c){ 
              // heuristics: standard 'testnet' flag or common name markers
              return Boolean(c.testnet) || /(test|goerli|sepolia|holesky|mumbai|fuji|rinkeby|kovan|ropsten)/i.test(c.name||'');
            }

            function render() {
              const q = norm(document.getElementById('q').value);
              const filtered = raw.filter(c => {
                const id = (c.chainId ?? '').toString();
                const n1 = norm(c.name);
                const n2 = norm(c.shortName);
                return !q || id.includes(q) || n1.includes(q) || n2.includes(q);
              });

              filtered.sort(sortKey === 'name' ? by('name') : by('chainId'));

              const tbody = document.getElementById('tbody');
              tbody.innerHTML = filtered.map(c => {
                const sym = c.nativeCurrency?.symbol || '-';
                const tags = [
                  isTestnet(c) ? '<span class="tag">testnet</span>' : '',
                  (c.slip44 === 1) ? '<span class="tag">ETH-like</span>' : ''
                ].filter(Boolean).join(' ');
                return \`
                  <tr>
                    <td>\${c.chainId}</td>
                    <td>\${c.name || '-'}</td>
                    <td class="muted">\${c.shortName || '-'}</td>
                    <td class="muted">\${sym}</td>
                    <td>\${tags}</td>
                    <td><button class="btn" onclick="selectChain(\${c.chainId})">Select</button></td>
                  </tr>\`;
              }).join('');
            }

            function toggleSort(key){
              if (sortKey === key) { sortDir *= -1; } else { sortKey = key; sortDir = 1; }
              render();
            }

            // Wiring
            document.getElementById('q').addEventListener('input', render);
            document.getElementById('sortId').addEventListener('click', () => toggleSort('chainId'));
            document.getElementById('sortName').addEventListener('click', () => toggleSort('name'));
            document.getElementById('sortId2').addEventListener('click', () => toggleSort('chainId'));
            document.getElementById('sortName2').addEventListener('click', () => toggleSort('name'));

            // Bridge back to opener
            window.selectChain = function(chainId){
              if (window.opener && !window.opener.closed) {
                // Fill input if present
                const input = window.opener.document.getElementById('chainID');
                if (input) input.value = chainId;

                // If the main window exposed checkAndSwitchNetwork, try to switch immediately
                try {
                  if (window.opener.checkAndSwitchNetwork && typeof window.opener.checkAndSwitchNetwork === 'function') {
                    window.opener.checkAndSwitchNetwork(Number(chainId));
                  }
                } catch(e){ /* ignore cross-origin or other errors */ }

                window.close();
              } else {
                alert('Main window is not accessible.');
              }
            };

            render(); // initial paint
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
    filePreview.innerHTML = ''; // Clear previous preview

    if (!files || files.length === 0) return;
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
