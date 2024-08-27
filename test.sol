// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "base58-solidity/contracts/Base58.sol";
contract NFTregistry{
    struct NFTInfo{
        uint256 chainid;
        address contractaddress;
        uint256 tokenid;
    }

    mapping(string => NFTInfo) public nfts;
    event NFTRegistered(string indexed filehash, uint256 chainid, address indexed contractAddress, uint256 tokenid);
    
    function registerNFT(string memory filehash,  uint256 chain, address contractAddress, uint256 tokenid) public {
        require(contractAddress != address(0), "Invalid contract address");
        require(nfts[filehash].contractaddress == address(0), "ID already used");
        bytes memory decodedBytes = Base58.decodeFromString(filehash);
        require(decodedBytes.length == 32, "File Hash is invalid");
        nfts[filehash] = NFTInfo(chain,contractAddress,tokenid);
        emit NFTRegistered(filehash, chain ,contractAddress, tokenid);
    }

    function getNFTInfo(string memory filehash) public view returns (uint256, address, uint256) {
        NFTInfo memory info = nfts[filehash];
        require(info.contractaddress != address(0), "Contract not found");
        return (info.chainid, info.contractaddress, info.tokenid);
    } 

    function isContractRegistered(string memory filehash) public view returns (bool) {
        return nfts[filehash].contractaddress != address(0);
    }

}

