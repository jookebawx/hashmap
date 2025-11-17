// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

/* ---------- Abstract verifier (OZ ECDSA + EIP712Upgradeable) ---------- */
abstract contract ClaimVerifier712Upgradeable is Initializable, EIP712Upgradeable {
    using ECDSA for bytes32;

    struct Claim {
        bytes32 filehash;            // keccak256(file) or canonical hash
        uint256 chain;           // chain where the NFT exists (e.g., 137)
        address contractAddress;                  // NFT contract on that chain
        uint256 tokenid;
        address registrant;           // wallet asserting ownership
        uint256 nonce;                // must match _nonces[registrant]
        uint256 deadline;             // signature expiry 
        bytes32 checkedAtL2BlockHash; // optional breadcrumb (stronger)
    }

    // replay protection
    mapping(address => uint256) internal _nonces;

    // EIP-712 typehash MUST exactly match the struct fields & order above
    bytes32 private constant _CLAIM_TYPEHASH = keccak256(
        "Claim(bytes32 filehash,uint256 chain,address contractAddress,uint256 tokenid,address registrant,uint256 nonce,uint256 deadline,bytes32 checkedAtL2BlockHash)"
    );

    /// @dev init on the PROXY (not in the implementation constructor)
    function __ClaimVerifier712_init(string memory name, string memory version)
        internal
        initializer
    {
        __EIP712_init(name, version);
    }

    function _hashClaim(Claim calldata c) public view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(
            _CLAIM_TYPEHASH,
            c.filehash,
            c.chain,
            c.contractAddress,
            c.tokenid,
            c.registrant,
            c.nonce,
            c.deadline,
            c.checkedAtL2BlockHash
        ));
        return _hashTypedDataV4(structHash);
    }

    /// @dev Default: EOA-only verification. Returns signer and consumes nonce.
    function _verifyAndConsumeNonce(Claim calldata c, bytes calldata sig)
        public
        returns (address signer)
    {
        require(block.timestamp <= c.deadline, "sig expired");
        require(c.nonce == _nonces[c.registrant], "bad nonce");
        signer = debugRecover(c,  sig);
        _nonces[signer] = c.nonce + 1;
    }

    /// @dev Hook for ERC-1271 override in subclass.
    function _recoverSigner(address expected, bytes32 digest, bytes calldata sig)
        internal
        view
        virtual
        returns (address)
    {
        address recovered = ECDSA.recover(digest, sig);
        require(recovered == expected, "signer != registrant");
        return recovered;
    }

    function nextNonce(address a) external view returns (uint256) {
        return _nonces[a];
    }

    // reserve storage for future upgrades
    uint256[49] private __gap;
    function debugHash(Claim calldata c) external view returns (bytes32) {
        return _hashClaim(c);
    }

    function debugRecover(Claim calldata c, bytes calldata sig)
        public view
        returns (address recovered)
    {
        bytes32 digest = _hashClaim(c);
        recovered = ECDSA.recover(digest, sig);
    }
    function debugPieces(Claim calldata c) external view returns (
        bytes32 domainSep,
        bytes32 typeHash,
        bytes32 structHash,
        bytes32 digest
    ) {
        bytes32 _typeHash = _CLAIM_TYPEHASH;
        bytes32 sHash = keccak256(abi.encode(
            _typeHash,
            c.filehash,
            c.chain,
            c.contractAddress,
            c.tokenid,
            c.registrant,
            c.nonce,
            c.deadline,
            c.checkedAtL2BlockHash
        ));
        bytes32 dom = _domainSeparatorV4(); // from EIP712Upgradeable
        bytes32 dig = _hashTypedDataV4(sHash);
    return (dom, _typeHash, sHash, dig);
}

function claimTypehashString() external pure returns (string memory) {
    // For you to eyeball; remove in prod if you don't like strings on-chain
    return "Claim(bytes32 filehash,uint256 chain,address contractAddress,uint256 tokenid,address registrant,uint256 nonce,uint256 deadline,bytes32 checkedAtL2BlockHash)";
}

// Inside ClaimVerifier712 or a debug-only helper contract

// assuming: struct Claim { bytes32 filehash; uint256 chain; address contractAddress; uint256 tokenid; address registrant; uint256 nonce; uint256 deadline; bytes32 checkedAtL2BlockHash; }

function debugClaim(Claim calldata c)
    external
    pure
    returns (
        bytes32 filehash,
        uint256 chain,
        address contractAddress,
        uint256 tokenid,
        address registrant,
        uint256 nonce,
        uint256 deadline,
        bytes32 checkedAtL2BlockHash
    )
{
    return (
        c.filehash,
        c.chain,
        c.contractAddress,
        c.tokenid,
        c.registrant,
        c.nonce,
        c.deadline,
        c.checkedAtL2BlockHash
    );
}

function _hashClaimDebug(Claim calldata c)
    public
    view
    returns (
        bytes memory encoded,   // abi.encode(TYPEHASH, fields...)
        bytes32 structHash,     // keccak256(encoded)
        bytes32 digest          // _hashTypedDataV4(structHash)
    )
{
    encoded = abi.encode(
        _CLAIM_TYPEHASH,
        c.filehash,
        c.chain,
        c.contractAddress,
        c.tokenid,
        c.registrant,
        c.nonce,
        c.deadline,
        c.checkedAtL2BlockHash
    );
    structHash = keccak256(encoded);
    digest = _hashTypedDataV4(structHash);
    return (encoded, structHash, digest);
}

}

/* ------------- Optional mixin: add ERC-1271 wallet support ------------- */
abstract contract ClaimVerifier712With1271Upgradeable is ClaimVerifier712Upgradeable {
    bytes4 private constant _ERC1271_MAGICVALUE = 0x1626ba7e;

    function _recoverSigner(address expected, bytes32 digest, bytes calldata sig)
        internal
        view
        virtual
        override
        returns (address)
    {
        if (expected.code.length == 0) {
            address recovered = ECDSA.recover(digest, sig);
            require(recovered == expected, "signer != registrant");
            return recovered;
        }
        bytes4 ok = IERC1271(expected).isValidSignature(digest, sig);
        require(ok == _ERC1271_MAGICVALUE, "invalid 1271 sig");
        return expected;
    }
}
