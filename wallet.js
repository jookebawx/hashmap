// wallet.js
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

export { connectMetaMask, getCurrentAccount };