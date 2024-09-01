// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NFTregistry{
    struct NFTInfo{
        uint256 chainid;
        address contractaddress;
        uint256 tokenid;
    }
    mapping(bytes32 => NFTInfo) private nfts;

    event NFTRegistered(bytes32 indexed filehash, uint256 chainid, address indexed contractAddress, uint256 tokenid);

    function registerNFT(bytes32 filehash,  uint256 chain, address contractAddress, uint256 tokenid) public {
        require(contractAddress != address(0), "Invalid contract address");
        require(nfts[filehash].contractaddress == address(0), "File already registered");
        nfts[filehash] = NFTInfo(chain, contractAddress, tokenid);
        emit NFTRegistered(filehash, chain ,contractAddress, tokenid);
    }

    function getNFTInfo(bytes32 filehash) public view returns (uint256, address, uint256) {
        NFTInfo memory info = nfts[filehash];
        require(info.contractaddress != address(0), "NFT information not found");
        return (info.chainid, info.contractaddress, info.tokenid);
    }

    function isContractRegistered(bytes32 filehash) public view returns (bool) {
        return nfts[filehash].contractaddress != address(0);
    }
}


