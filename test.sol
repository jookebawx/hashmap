// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NFTregistry{
    struct NFTInfo{
        string chainid;
        address contractaddress;
        int tokenid;
    }

    mapping(string => NFTInfo) public nfts;
    event NFTRegistered(string indexed filehash, string chainid, address indexed contractAddress, int tokenid);
    
    function registerNFT(string memory filehash,  string memory chain, address contractAddress, int tokenid) public {
        require(contractAddress != address(0), "Invalid contract address");
        require(nfts[filehash].contractaddress == address(0), "ID already used");
        require(isContract(contractAddress), "Address is not a deployed contract");
        nfts[filehash] = NFTInfo(chain,contractAddress,tokenid);
        emit NFTRegistered(filehash, chain ,contractAddress, tokenid);
    }

    function getNFTInfo(string memory filehash) public view returns (string memory, address, int) {
        NFTInfo memory info = nfts[filehash];
        require(info.contractaddress != address(0), "Contract not found");
        return (info.chainid, info.contractaddress, info.tokenid);
    } 

    function isContractRegistered(string memory filehash) public view returns (bool) {
        return nfts[filehash].contractaddress != address(0);
    }

    function isContract(address _addr) public view returns (bool) {
        uint256 size;
        // Inline assembly to check the size of the code at the address
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }       
}

