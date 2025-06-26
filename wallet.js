// wallet.js
async function connectMetaMask() {
    if (window.ethereum) {
        try {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
            const account = await getCurrentAccount();
            if (account) {
                // Add animation to header and button
                const header = document.getElementById('header');
                const connectButton = document.getElementById('connectButton');
                header.classList.add('opacity-0', 'translate-y-[-20px]'); // Fade out and move up
                connectButton.classList.add('opacity-0', 'translate-y-[-20px]'); // Fade out and move up

                // Wait for the animation to finish (500ms, matching the transition duration)
                setTimeout(() => {
                    // Hide the header and button
                    header.classList.add('hidden');
                    connectButton.classList.add('hidden');

                    // Show the rest of the content
                    document.getElementById('walletAddress').classList.remove('hidden');
                    document.getElementById('upload').classList.remove('hidden');
                    document.getElementById('check').classList.remove('hidden');

                    // Display the connected wallet address
                    document.getElementById('address').textContent = account;
                }, 500); // Match the duration of the transition (500ms)
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