# GAIA GreenTech Smart Contract

```shell
# In case you altered the contract .SOL file
npm run compile

# Create a NFT smart contract with 60 seconds of interval. 
npm run deploy-testnet -- --interval 60 

# Create a NFT market place with a 2.5 GWEI fee. Fees are in WEI
npm run deploy-marketplace-testnet -- --fee 2500000000

# Return the contract address
# >  0xF2d44BcdA1Ad0c8C2f88e618B4e2e27483bc13A6

# Add the minter for the tokens as its documentation that proves that a company owns the address.
npm run add-minter -- --contract 0xF2d44BcdA1Ad0c8C2f88e618B4e2e27483bc13A6 --address 0xe52025ECFe3E724203f755118e20C73500A6Ac6A --document https://ipfs.io/ipfs/QmTPRK55hNGXsduqurPmg84TVBx2Bao58JRXXXQaWfTL8x

# Returns nothing but success response.

# Take all files from /files and generate ./metadata/metadata.json from them. Also add the weight of 390 kg
npm run generate-metadata -- --path "./files" --weight 390

# >  File uploaded to IPFS with hash: /ipfs/QmT5t5X2AeFrDNasyKhH5oSr6sP1uio5ePtKnyPat6gzSs
# >  File uploaded to IPFS with hash: /ipfs/QmP3thQv1xzB597dvtHSZCVHXaFncDZjMG7abjGYWL94Kc
# >  File uploaded to IPFS with hash: /ipfs/QmVZY9b5p28BBv1yfy3z4dYgLZkNZcC2GzVSaYdu3gtRhk
# >  File uploaded to IPFS with hash: /ipfs/QmXSw6RZquvADdNqpg3dXvR6YYqrzpYvk4QjY89msRku7J
# >  Metadata file saved to ./metadata/metadata.json

# Upload a metadata to IPFS
npm run upload-metadata -- --metadata "./metadata/metadata.json" 

# Return the metadata uri 
# >  File uploaded to IPFS with hash: /ipfs/QmTwF4RAH1wTZbnEumURy3XbWN2vGniz87QN7Sw514gs6t

# Mint an NFT using the metadata. Rememeber to add it to "https://ipft.io<YOUR URL> and to add the address you want to mint to." 
npm run mint-testnet -- --contract 0x4FCb2F2FBd6f67AB480412e83243c642b381BD76 --address 0xe52025ECFe3E724203f755118e20C73500A6Ac6A --uri https://ipfs.io/ipfs/QmTPRK55hNGXsduqurPmg84TVBx2Bao58JRXXXQaWfTL8x 

# Return the transaction id
# >  Minted NFT to 0xfCEB2DaF512e5Fd2Ca7C81a9998469603F46E6F2 on transaction 0x6fc53864a3854def0b80811089a791154d2884d89b31dda7b814534bc5754e91
```
