// contract.js
import { getCurrentAccount } from './wallet.js';
import { renderOwnerInfo, renderError, displayChainResult } from './render.js';
import { getChainInfo, checkAndSwitchNetwork, getL2BlockHashByChainId } from './network.js';

async function fetchABI(abipath) {
    const response = await fetch(abipath);
    return response.json();
}

async function loadContract(abipath, contractaddress) {
    const abi = await fetchABI(abipath);
    return new window.web3.eth.Contract(abi, contractaddress);
}

async function computeGroupHash(files) {
    const fileHashes = [];

    for (const file of files) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hex = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        fileHashes.push(hex);
    }

    if (fileHashes.length === 1) {
        return '0x' + fileHashes[0];
    } else {
        fileHashes.sort(); // Ensure consistent ordering
        const concatenated = fileHashes.join('');
        const encoder = new TextEncoder();
        const finalBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(concatenated));
        return '0x' + Array.from(new Uint8Array(finalBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

async function getL2BlockHash(rpcUrl, blockTag = "latest") {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: 1, jsonrpc: "2.0", method: "eth_getBlockByNumber",
      params: [blockTag === "latest" ? "latest" : ("0x" + Number(blockTag).toString(16)), false]
    })
  });
  const { result } = await res.json();
  if (!result || !result.hash) throw new Error("Block not found from L2 RPC");
  return result.hash; // already 0x…32-bytes
}

async function verify() {
    const contractaddress = "0xBc21149cAee7E26B58ea0cc3FF9247c949e80481";
    const abipath = 'abi.json';
    await checkAndSwitchNetwork(11155111); // Ensure this function is imported
    const fileInput = document.getElementById('fileToUpload');
    const files = fileInput.files;

    if (!files || files.length === 0) {
        alert("Please select a file or files to verify.");
        return;
    }

    const groupHash = await computeGroupHash(files);
    console.log(groupHash)

    window.contract = await loadContract(abipath, contractaddress);
    const account = await getCurrentAccount();
    try {
        const metadata = await window.contract.methods.getNFTInfo(groupHash).call();
        displayChainResult(metadata);
    } catch (error) {
        alert(error.message);
        document.getElementById('chainResult').innerHTML = '';
    }
}

async function registernft() {
    const contractaddress = "0xBc21149cAee7E26B58ea0cc3FF9247c949e80481";
    const abipath = 'abi.json';
    const selected_chain_id = parseInt(document.getElementById('chainID').value);
    const register_CA = document.getElementById('contractAddress').value;
    const register_tokenid = parseInt(document.getElementById('tokenId').value);
    const ownerabi = 'getMetadataABI.json';
    const fileInput = document.getElementById('fileToUpload');
    const files = fileInput.files;
    const claim = await (await fetch('claim.json')).json()
    console.log(claim.message);

    if (!files || files.length === 0) {
        alert('Please select one or more files to upload.');
        return;
    }

     if (!selected_chain_id || !register_CA || !register_tokenid) {
        alert('Please fill out all required fields: Chain ID, Contract Address, and Token ID.');
        [selected_chain_id, register_CA, register_tokenid].forEach(input => {
            if (!input.value) input.classList.add('border-red-500');
        });
        return;
    }
    const account = await getCurrentAccount();

    try {
        await checkAndSwitchNetwork(selected_chain_id);
        const contract = await loadContract(ownerabi, register_CA);
        const owner = await contract.methods.ownerOf(register_tokenid).call();
        if (owner != account){
            alert("Only owners can register the NFT");
            return;
        }else{
            const groupHash = await computeGroupHash(files);
            console.log(groupHash);
            await checkAndSwitchNetwork(11155111);
            const resolvercontract = await loadContract(abipath, contractaddress);
            const isRegistered = await resolvercontract.methods.isContractRegistered(groupHash).call();
            if (isRegistered) {
                alert("This file or group of files has already been registered.");
                return;
            }
            if(selected_chain_id != 11155111){
                const n = await resolvercontract.methods.nextNonce(account).call()
                console.log(n)
                claim.message.filehash = groupHash;
                claim.message.chain = selected_chain_id
                claim.message.contractAddress = register_CA
                claim.message.tokenid = register_tokenid
                claim.message.registrant = account
                const latest = await web3.eth.getBlock('latest').timestamp;
                console.log(latest);
                const latestBlock = await web3.eth.getBlock("latest");
                const nowSec = Number(latestBlock.timestamp);
                console.log(nowSec)
                claim.message.deadline = String(nowSec + 600)
                claim.message.nonce = toUintString(n)
                console.log(claim.message.deadline)
                await checkAndSwitchNetwork(selected_chain_id);
                claim.message.checkedAtL2BlockHash =await getL2BlockHashByChainId(selected_chain_id, 'finalized');
                console.log(claim)
                await checkAndSwitchNetwork(11155111);
                const signature = await window.ethereum.request({
                    method: 'eth_signTypedData_v4',
                    params: [account, JSON.stringify(claim)],
                });
                console.log(signature)
                const inputTuple=[groupHash, selected_chain_id, register_CA, register_tokenid, account, toUintIntStrict(n), claim.message.deadline, claim.message.checkedAtL2BlockHash]
                console.log("inputTuple=",inputTuple)
                const types = {
                    Claim: [
                        { name: "filehash", type: "bytes32" },
                        { name: "chain", type: "uint256" },
                        { name: "contractAddress", type: "address" },
                        { name: "tokenid", type: "uint256" },
                        { name: "registrant", type: "address" },
                        { name: "nonce", type: "uint256" },
                        { name: "deadline", type: "uint256" },
                        { name: "checkedAtL2BlockHash", type: "bytes32" },
                    ],
                };
                const message = {
                    filehash: groupHash,
                    chain: selected_chain_id,
                    contractAddress: register_CA,
                    tokenid: register_tokenid,
                    registrant: account,
                    nonce: toUintIntStrict(n),
                    deadline: 600000,
                    checkedAtL2BlockHash: claim.message.checkedAtL2BlockHash,
                };
                console.log(message)
                const domain = claim.domain
                // const test = await resolvercontract.methods._verifyAndConsumeNonce(inputTuple, signature).call();
                await resolvercontract.methods.registerNFTL2(inputTuple, signature ).send({ from: account });
                alert("NFT registered successfully!");
                return;
            }else{
                await resolvercontract.methods.registerNFTonChain(groupHash, selected_chain_id, register_CA, register_tokenid).send({ from: account });
                alert("NFT registered successfully!");
                return;
            }
        }
    } catch (error) {
        if (error.code === 1100) {
            alert(`Error: Invalid Contract Address Input. Check Again`);
        } else {
            alert(`Error: ${error.message || error}`);
            console.log(error)
        }
    }
}


async function fetchOwnerWithNetworkCheck(tokenId, contractAddress, requiredChainId) {
    await checkAndSwitchNetwork(requiredChainId); // Ensure we're on the correct network

    const startTime = performance.now();
    const resultDiv = document.getElementById('ownerOf');
    const ownerabi = 'getMetadataABI.json'; // Path to ABI file containing both ownerOf and tokenURI functions
    const contract = await loadContract(ownerabi, contractAddress);
    console.log(contract)
    try {
        // Fetch owner and metadata
        const [owner, tokenURI] = await Promise.all([
            contract.methods.ownerOf(tokenId).call(),
            contract.methods.tokenURI(tokenId).call()
        ]);
        console.log(owner)
        // Get metadata URL
        const metadataUrl = tokenURI.startsWith('ipfs://') 
            ? `https://ipfs.io/ipfs/${tokenURI.substring(7)}` 
            : tokenURI;

        // Fetch metadata
        // const metadataResponse = await fetch(metadataUrl);
        // const metadata = await metadataResponse.json();

        // Get chain info
        const chaininfo = await getChainInfo(requiredChainId);
        // findImageUrl(metadataUrl)
        // Render result dynamically
        resultDiv.innerHTML = renderOwnerInfo({
            owner,
            chaininfo,
            metadataUrl,
            tokenURI,
        });

    } catch (error) {
        console.error(`Error fetching owner or metadata: ${error.message}`);
        resultDiv.innerHTML = renderError({ errorMessage: error.message });
    }

    const endTime = performance.now();
    console.log(`Execution time: ${endTime - startTime} ms`);
}

export function toUintIntStrict(v) {
  let bi;
  if (typeof v === 'bigint') bi = v;
  else if (typeof v === 'number') {
    if (!Number.isFinite(v) || v < 0 || !Number.isInteger(v)) throw new Error('Invalid number for uint');
    return v; // already an int
  } else if (typeof v === 'string') {
    bi = v.startsWith('0x') ? BigInt(v) : BigInt(v); // hex or decimal
  } else if (v && typeof v.toString === 'function') {
    bi = BigInt(v.toString()); // e.g., ethers BigNumber, BN.js
  } else {
    throw new Error('Unsupported uint value');
  }

  if (bi < 0n) throw new Error('Negative value not allowed for uint');
  if (bi > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Value ${bi} exceeds JS safe integer; use BN/string instead`);
  }
  return Number(bi);
}

function toUintString(v) {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v.startsWith('0x') ? BigInt(v).toString() : v;
  if (v && typeof v.toString === 'function') return v.toString(); // ethers BigNumber
  throw new Error('Unsupported nonce type');
}

async function findImageUrl(metadataUrl) {
    try {
        // Fetch the JSON data from the metadata URL
        const response = await fetch(metadataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON data
        const metadata = await response.json();

        // Iterate through the key-value pairs to find the image URL
        for (const [key, value] of Object.entries(metadata)) {
            // Check if the value is a string and matches a common image URL pattern
            if (typeof value === 'string' && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(value)) {
                console.log(`Image URL found in key "${key}": ${value}`);
            }
        }

        // If no image URL is found
        console.log('No image URL found in the metadata.');
        return null;

    } catch (error) {
        console.error('Error fetching or parsing the metadata:', error);
        return null;
    }
}


// If contract has a view returning its domain separator:
// const onchainDomainSep = await resolver.DOMAIN_SEPARATOR();
// console.log('On-chain domain separator:', onchainDomainSep);

export { fetchABI, loadContract, verify, registernft, fetchOwnerWithNetworkCheck };