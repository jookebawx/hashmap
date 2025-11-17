// network.js
// network.js
async function getChainInfo(chainId) {
  try {
    const response = await fetch('https://chainid.network/chains.json');
    const data = await response.json();
    const chain = data.find(c => c.chainId == chainId);

    if (!chain) {
      return { name: null, explorers: [], rpcUrls: [], rpcUrl: null };
    }

    // Normalize explorers to keep your existing shape
    const explorers = Array.isArray(chain.explorers)
      ? chain.explorers.map(e => ({ name: e.name || 'Explorer', url: e.url }))
      : [];

    // RPCs as provided by chainid.network (may include templated URLs)
    const rpcUrls = Array.isArray(chain.rpc)
      ? chain.rpc.filter(u => typeof u === 'string' && u.trim().length > 0)
      : [];

    const rpcUrl = rpcUrls.length ? rpcUrls[0] : null;

    return {
      name: chain.name,
      explorers,
      rpcUrls,
      rpcUrl,
    };
  } catch (error) {
    console.error('Error fetching chain info:', error);
    return { name: null, explorers: [], rpcUrls: [], rpcUrl: null };
  }
}


async function checkAndSwitchNetwork(requiredChainId) {
    if (window.ethereum) {
        try {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (parseInt(currentChainId, 16) !== requiredChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + requiredChainId.toString(16) }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        const chainInfo = await getChainInfo(requiredChainId);
                        if (chainInfo.name) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x' + requiredChainId.toString(16),
                                    chainName: chainInfo.name,
                                    rpcUrls: chainInfo.rpcUrls || [],
                                    nativeCurrency: {
                                        name: chainInfo.nativeCurrency.name,
                                        symbol: chainInfo.nativeCurrency.symbol,
                                        decimals: chainInfo.nativeCurrency.decimals,
                                    },
                                }],
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking or switching network:', error);
        }
    } else {
        console.error('MetaMask is not installed');
    }
}
// network.js

// Prefer plain HTTPS URLs; ignore templated entries like ${INFURA_API_KEY}
function pickUsableRpcUrl(rpcUrls) {
  if (!Array.isArray(rpcUrls)) return null;
  // filter out placeholders or non-http(s)
  const cleaned = rpcUrls.filter(u =>
    typeof u === 'string' &&
    /^https?:\/\//i.test(u) &&
    !u.includes('${') && !u.includes('{')
  );
  return cleaned.length ? cleaned[0] : null;
}

async function jsonRpc(rpcUrl, method, params = []) {
  if (!rpcUrl) throw new Error('No RPC URL available for this chain.');
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params })
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || 'RPC error');
  return body.result;
}

/**
 * Get a block hash from an RPC URL.
 * @param {string} rpcUrl - HTTPS RPC endpoint
 * @param {"latest"|"safe"|"finalized"|number} blockTagOrNumber
 */
async function getL2BlockHashFromRpc(rpcUrl, blockTagOrNumber = 'latest') {
  let tag;
  if (typeof blockTagOrNumber === 'number') {
    tag = '0x' + blockTagOrNumber.toString(16);
  } else {
    // "latest" | "safe" | "finalized" | "earliest" all valid
    tag = blockTagOrNumber;
  }
  const block = await jsonRpc(rpcUrl, 'eth_getBlockByNumber', [tag, false]);
  if (!block || !block.hash) throw new Error('Block not found');
  return block.hash; // 0x…32 bytes
}

/**
 * Convenience: fetch RPC from chainid, then return the block hash.
 * @param {number} chainId
 * @param {"latest"|"safe"|"finalized"|number} blockTagOrNumber
 */
async function getL2BlockHashByChainId(chainId, blockTagOrNumber = 'latest') {
  const info = await getChainInfo(chainId); // your existing function:contentReference[oaicite:1]{index=1}
  const rpcUrl = info.rpcUrl || pickUsableRpcUrl(info.rpcUrls);
  console.log(info)
  if (!rpcUrl) throw new Error(`No usable RPC URL for chain ${chainId}.`);
  return getL2BlockHashFromRpc(rpcUrl, blockTagOrNumber);
}


export { getChainInfo, checkAndSwitchNetwork, getL2BlockHashByChainId };