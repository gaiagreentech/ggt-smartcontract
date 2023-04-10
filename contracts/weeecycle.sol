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

    mapping(uint256 => uint256) private _tokenCreationTimestamps; // Mapping of token IDs to their creation timestamps

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

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Check if any token needs upkeep
    function checkUpkeep(bytes calldata /* checkData */) external view returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = false;
        // Create an array of tokens to burn, that has the max size of 10
        uint256[] memory tokensToBurn = new uint256[](10);
        uint256 tokensToBurnCount = 0;
        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            uint256 creationTimestamp = _tokenCreationTimestamps[i];
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
            }
        }
    }

    // Mint a new token and set its creation timestamp
    function safeMint(address to, string memory uri) public onlyOwner {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _tokenCreationTimestamps[tokenId] = block.timestamp;
    }

    // Get the creation timestamp of a specific token
    function tokenCreationTimestamp(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenCreationTimestamps[tokenId];
    }

    function burn(uint256 tokenId) public override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        _burn(tokenId);
    }

    // Override the _burn function to delete the token creation timestamp
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        delete _tokenCreationTimestamps[tokenId];
        super._burn(tokenId);
    }

    // Override the tokenURI function to use ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
