// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ClaimVerifier712Upgradeable} from "ClaimVerifier.sol";

contract NFTresolver is ClaimVerifier712Upgradeable{
    // ---- storage layout: SAME as V1 (append-only changes later) ----
    struct NFTInfo {
        uint256 chainid;
        address contractaddress;
        uint256 tokenid;
    }
    mapping(bytes32 => NFTInfo) private nfts;

    // ---- onlyProxy guard (works with any ERC1967 proxy, incl. Transparent) ----
    address private immutable __self = address(this);
    // keccak-256("eip1967.proxy.implementation") - 1
    bytes32 internal constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    // modifier onlyProxy() {
    //     // must be called via delegatecall (through a proxy)
    //     require(address(this) != __self, "Resolver: call must come through proxy");
    //     // and the proxy must be pointing at this implementation
    //     require(_getImplementation() == __self, "Resolver: inactive implementation");
    //     _;
    // }

    function _getImplementation() internal view returns (address impl) {
        bytes32 slot = _IMPLEMENTATION_SLOT;
        assembly { impl := sload(slot) }
    } 

    function initialize() external {
        __ClaimVerifier712_init("Resolver", "1");
    // …other init…
    }
    // ---- your original functions, now guarded ----
    event NFTRegistered(bytes32 indexed filehash, uint256 chainid, address indexed contractAddress, uint256 tokenid);

    function registerNFTonChain(
        bytes32 filehash, 
        uint256 chain, 
        address contractAddress, 
        uint256 tokenid
        )
        public

    {
        require(nfts[filehash].contractaddress == address(0), "File already registered");
        require(contractAddress != address(0), "Invalid contract address");
        require(chain == block.chainid);
        address o = IERC721(contractAddress).ownerOf(tokenid);
        bool ok = (o == msg.sender) // use your 2771 shim if you have one
        || (IERC721(contractAddress).getApproved(tokenid) == msg.sender)
        || IERC721(contractAddress).isApprovedForAll(o, msg.sender);
        require(ok, "Not the owner");
        nfts[filehash] = NFTInfo(chain, contractAddress, tokenid);
        emit NFTRegistered(filehash, chain, contractAddress, tokenid);
    }

    function registerNFTL2(
        Claim calldata c,
        bytes calldata sig)
        public

    {
        require(nfts[c.filehash].contractaddress == address(0), "File already registered");
        require(c.contractAddress != address(0), "Invalid contract address");
        address o = _verifyAndConsumeNonce(c, sig);
        require(o==msg.sender, "bad claim"); 
        
        nfts[c.filehash] = NFTInfo(c.chain, c.contractAddress, c.tokenid);
        emit NFTRegistered(c.filehash, c.chain, c.contractAddress, c.tokenid);
    }

    function getNFTInfo(bytes32 filehash)
        public
        view
        returns (uint256, address, uint256)
    {
        NFTInfo memory info = nfts[filehash];
        require(info.contractaddress != address(0), "NFT information not found");
        return (info.chainid, info.contractaddress, info.tokenid);
    }

    function isContractRegistered(bytes32 filehash) public view returns (bool) {
        return nfts[filehash].contractaddress != address(0);
    }
}
