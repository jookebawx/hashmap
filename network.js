// network.js
async function getChainInfo(chainId) {
    try {
        const response = await fetch('https://chainid.network/chains.json');
        const data = await response.json();
        const chain = data.find(chain => chain.chainId == chainId);
        if (chain) {
            const name = chain.name;
            const explorers = chain.explorers ? chain.explorers.map(explorer => explorer) : [];
            return { name, explorers };
        } else {
            return { name: null, explorers: [] };
        }
    } catch (error) {
        console.error('Error fetching chain info:', error);
        return { name: null, explorers: [] };
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
                                    rpcUrls: [chainInfo.rpc],
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

export { getChainInfo, checkAndSwitchNetwork };