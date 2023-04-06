// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

contract WEEECycleNFT is KeeperCompatibleInterface, ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter; // Counter for tracking token IDs
    uint256 lastTimeStamp; // Last time the contract performed upkeep
    uint256 interval; // Lifespan interval for each token

    mapping(uint256 => uint256) private _tokenCreationTimestamps; // Mapping of token IDs to their creation timestamps

    constructor(uint256 _interval) ERC721("WEEECycleNFT", "WEEE") {
        interval = _interval;
        lastTimeStamp = block.timestamp;
    }

    // Check if any token needs upkeep
    function checkUpkeep(bytes calldata /* checkData */) external view returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = false;

        // Iterate over all existing tokens and check their creation timestamps
        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            uint256 creationTimestamp = _tokenCreationTimestamps[i];
            if ((block.timestamp - creationTimestamp) > interval) {
                // If a token's lifespan has expired, set upkeepNeeded to true and encode the token ID and time elapsed since creation
                upkeepNeeded = true;
                performData = abi.encode(i);
                break;
            }
        }
    }

    // Perform upkeep for a specific token
    function performUpkeep(bytes calldata performData) external override {
        uint256 tokenId = abi.decode(performData, (uint256));
        _burn(tokenId);
        message(tokenId);
    }

    function message(uint256 tokenBurned) public pure returns (uint256){
        return tokenBurned;
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

    function publicBurn(uint256 tokenId) public {
        _burn(tokenId);
    }

    // Override the _burn function to delete the token creation timestamp
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
        delete _tokenCreationTimestamps[tokenId];
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
