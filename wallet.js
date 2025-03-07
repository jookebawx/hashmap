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

                // Wait for the animation to finish
                setTimeout(() => {
                    header.classList.add('hidden'); // Hide the header
                    connectButton.classList.add('hidden'); // Hide the button

                    // Show the rest of the content
                    document.getElementById('walletAddress').style.display = 'block';
                    document.getElementById('upload').style.display = 'block';
                    document.getElementById('check').style.display = 'block';
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