// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

contract WEEECycleNFT is KeeperCompatibleInterface, ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ERC721Burnable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter; // Counter for tracking token IDs
    uint256 interval; // Lifespan interval for each token


    mapping(uint256 => uint256) private _tokensToDelete;
    mapping(uint256 => uint256) private _tokenCreationTimestamps; // Mapping of token IDs to their creation timestamps
    mapping(uint256 => uint256) private _tokenBurnTimestamps;
    mapping(uint256 => address) private _tokenBurnOwnershipBeforeBurn;
    mapping(address => string) private _minters; // Mapping of minter addresses to their document URIs
    mapping(uint256 => address) private _tokenMinters; // Mapping of token IDs to their initial minters

    mapping(address => Counters.Counter ) private _tokenBurnCount;

    struct TokenBurnData {
        address owner;
        uint256 tokenId;
        address ownershipBeforeBurn;
        uint256 burnTimestamp;
    }

    constructor(uint256 _interval) ERC721("WEEECycleNFT", "WEEE") {
        interval = _interval;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize) internal override(ERC721, ERC721Enumerable) 
    {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function addMinter(address minter, string memory documentURI) public onlyOwner {
        _minters[minter] = documentURI;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

      // Check if an address is a minter
    function isMinter(address minter) public view returns (bool) {
        return bytes(_minters[minter]).length > 0;
    }

    // Get the document URI of a minter
    function getMinterDocumentURI(address minter) public view returns (string memory) {
        require(isMinter(minter), "Address is not a minter");
        return _minters[minter];
    }


    // Check if any token needs upkeep
    function checkUpkeep(bytes calldata /* checkData */) external view returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = false;
        // Create an array of tokens to burn, that has the max size of 10
        uint256[] memory tokensToBurn = new uint256[](10);
        uint256 tokensToBurnCount = 0;
        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            uint256 creationTimestamp = _tokensToDelete[i];
            if (creationTimestamp == 0) {
                continue;
            }
            if ((block.timestamp - creationTimestamp) >= interval) {
                upkeepNeeded = true;
                tokensToBurn[tokensToBurnCount] = i;
                tokensToBurnCount++;
            }
        }
        if (upkeepNeeded) {
            performData = abi.encode(tokensToBurn);
        }
    }

    // Perform upkeep for a specific token
    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory tokensToBurn = abi.decode(performData, (uint256[]));
        for (uint256 i = 0; i < tokensToBurn.length; i++) {
            // Since the tokens array is fixed length, we need to check if the token ID is 0, because it fills the elements
            if(tokensToBurn[i] != 0){
                _burn(tokensToBurn[i]);
                delete _tokensToDelete[tokensToBurn[i]];
            }
        }
    }

    // Mint a new token and set its creation timestamp, only callable by minters
    function safeMint(address to, string memory uri) public {
        require(isMinter(msg.sender), "Caller is not a minter");
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        ERC721._safeMint(to, tokenId);
        ERC721URIStorage._setTokenURI(tokenId, uri);
        _tokensToDelete[tokenId] = block.timestamp;
        _tokenCreationTimestamps[tokenId] = block.timestamp;
        _tokenMinters[tokenId] = msg.sender;
    }
    
    // Get the initial minter of a specific token
    function tokenMinter(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenMinters[tokenId];
    }


    // Get the creation timestamp of a specific token
    function tokenCreationTimestamp(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenCreationTimestamps[tokenId];
    }

    function _beforeBurn(uint256 tokenId) internal virtual {
        _tokenBurnOwnershipBeforeBurn[tokenId] = ownerOf(_tokenIdCounter.current());
        _tokenBurnTimestamps[tokenId] = block.timestamp;
        _tokenBurnCount[ownerOf(tokenId)].increment();
    }

    function burn(uint256 tokenId) public override(ERC721Burnable){
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        _beforeBurn(tokenId);
        _burn(tokenId);
    }

    function getTokenBurnCount(address owner) public view returns (uint256) {
        return _tokenBurnCount[owner].current();
    }

    function getTokenBurnOwnershipBeforeBurn(uint256 tokenId) public view returns (address) {
        return _tokenBurnOwnershipBeforeBurn[tokenId];
    }

    function getTokenBurnTimestamp(uint256 tokenId) public view returns (uint256) {
        return _tokenBurnTimestamps[tokenId];
    }

    // Override the _burn function to delete the token creation timestamp
    function _burn(uint256 tokenId)
        internal
        virtual
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    // Override the tokenURI function to use ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function getAllBurnsFromAddress(address owner) public view returns (TokenBurnData[] memory) {
        uint256 burnCount = _tokenBurnCount[owner].current();
        TokenBurnData[] memory result = new TokenBurnData[](burnCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            uint256 tokenId = i;
            if (_tokenBurnOwnershipBeforeBurn[tokenId] == owner) {
                result[resultIndex] = TokenBurnData(
                    owner, 
                    tokenId, 
                    _tokenBurnOwnershipBeforeBurn[tokenId], 
                    _tokenBurnTimestamps[tokenId]
                );
                resultIndex++;
            }
        }
        return result;
    }


}
