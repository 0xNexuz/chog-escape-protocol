# Chogathon submission draft

## Project

**Name:** Chog Escape Protocol  
**One-line description:** Your Chog NFT becomes the character, powers, and daily world of a tactical escape game.  
**Team members / Discord / X:** Enter your own details on the submission form; the user will submit it.

## What we built

Chog Escape Protocol is a daily tactical heist on a small maze. Players collect three signal fragments, avoid traps and chasing drones, then reach extraction. Each Chog Genesis NFT creates its own deterministic daily route. Its traits change the rules: Fire Aura unlocks Firestorm, laser eyes unlock Laser, other traits unlock Phase; Eyes also change vision, Body changes hearts, and Head changes power capacity.

## Why Chog is essential

The game reads the actual Chog Genesis NFT contract on Monad. Live play compares the connected wallet with `ownerOf(tokenId)`. The NFT's token ID and metadata form the seed for the daily maze, while its traits supply the loadout. Remove the NFT and you remove both the player's character and the input that generates that player's game.

## Demo and testing

**Live URL:** https://chog-escape-protocol.vercel.app  
**Demo video (≤3 minutes):** Pending recording/upload  
**Repository:** https://github.com/0xNexuz/chog-escape-protocol  
**Test steps:** Open the URL. Select Fire Chog #973, start a preview run, move with arrows/WASD or on-screen controls, press Space or Use Power, collect three fragments, reach the exit. Switch to Laser Chog #533 to see a different power and route. Owners can connect a wallet and enter their own onchain token ID for live ownership verification. Preview is expressly labeled as simulated ownership.

## Under the hood

Vanilla HTML/CSS/JavaScript; Node serverless API; Monad mainnet JSON-RPC; Chog Genesis ERC-721 `ownerOf` and `tokenURI`; public IPFS metadata. No private keys or wallet transactions. `npm test` covers the deterministic game core. Personal bests are local to the browser.

## Pre-existing work and what is next

No pre-existing application code was copied into this project. The next steps are global verified score receipts, social challenge links, additional mission patterns, and optional community events. These are roadmap ideas, not current features.
