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
**Demo video (≤3 minutes):** Outstanding; the user will record and upload it. No video was created in this pass.
**Repository:** https://github.com/0xNexuz/chog-escape-protocol  
**Test steps:** Open the URL. Select Fire Chog #973 and start a labeled preview run. Move with arrows/WASD or touch controls; press Space or Use Power to clear nearby hazards. Collect three fragments and reach the lime exit by turn 45. Switch to Laser Chog #533 to see a different power and route. Retry the same daily maze, earn local badges for successful escapes, and copy or download a result card. Owners can connect a wallet and enter their own onchain token ID for ownership verification. Verified mode rechecks ownership at run start. If live metadata fails, #973 is labeled SAMPLE DATA / PREVIEW.

## Under the hood

Vanilla HTML/CSS/JavaScript; Node serverless API; Monad mainnet JSON-RPC; Chog Genesis ERC-721 `ownerOf` and `tokenURI`; public IPFS metadata. No private keys or wallet transactions. Automated tests cover game rules, representative full routes, local progress, and API failures. Completed runs, badges, streaks, and personal bests are local to the browser and can be edited by the player. No onchain score proof or global leaderboard is claimed.

## Pre-existing work and what is next

No pre-existing application code was copied into this project. The next steps are global verified score receipts, social challenge links, additional mission patterns, and optional community events. These are roadmap ideas, not current features.
