# Chog Escape Protocol

**Your NFT is the game.** Chog Escape Protocol is a daily turn-based tactical heist. A Chog Genesis NFT determines the player's powers, health, vision, energy, and daily maze. Each Chog produces a different route. The owner can verify the token on Monad and play it; everyone else can explore a clearly labeled preview using real public NFT metadata.

Built for [Chogathon 2026](https://chogathon.chog.xyz/).

## Why the NFT matters

1. **Access:** live mode checks `ownerOf(tokenId)` on the Chog Genesis contract against the connected wallet.
2. **Ability:** Aura, Eyes, Body, and Head traits map to Firestorm, Laser, or Phase plus hearts, vision, and charge capacity.
3. **World:** the token ID and actual metadata traits seed a deterministic maze that changes each UTC day.

Without the NFT, these mechanics lack their identity and inputs. Preview mode simulates ownership for non-holders and is prominently labeled.

## Try it

```bash
npm run dev
```

Open `http://localhost:3000`. No install step or API key is required. Click **Fire Chog #973** or **Laser Chog #533**, start a run, move with WASD, arrow keys, or the touch controls, and use your power with Space or the power button. Collect all three fragments and reach the lime exit before turn 45. A retry uses the same daily maze; switching tokens changes the build and maze.

To use an owned Chog, connect an EVM wallet and enter its **onchain token ID** (which may differ from the number in the artwork's name). The app compares the connected address to `ownerOf` on Monad mainnet. It requests no transaction or signature.

## Under the hood

- Vanilla HTML, CSS, and browser JavaScript, with no runtime packages.
- Node serverless function `api/nft.js` reads `ownerOf` and `tokenURI` from Chog Genesis on Monad mainnet (`chainId 143`), then retrieves public metadata via IPFS. It returns only allowlisted trait fields and an image URL.
- Pure game engine in `game-core.mjs` generates a deterministic daily route and applies movement, traps, drones, power effects, and scoring.
- Personal bests are stored in this browser. The share card identifies preview versus verified runs.
- No private key, transaction, database, paid API, or onchain score claim.

The Chog Genesis contract is `0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763` on Monad mainnet. Monad's public RPC is `https://rpc.monad.xyz`. Both were checked against [OpenSea's Chog Genesis token page](https://opensea.io/item/monad/0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763/973) and [Monad's developer information](https://github.com/monad-developers).

## Verify

```bash
npm test
```

The tests check trait-derived abilities, deterministic token-specific maps, and non-mutating turns. For a live integration check, open the app and confirm that #973 loads as `CHOG #465`, then switch to #533 and confirm `LASER`. The public metadata gateway can be slow; if it fails, the app labels #973 as sample data and keeps owner verification unavailable until a live lookup succeeds.

## Known limits

- Wallet ownership is verified when a live NFT is selected, not continuously during a run. This is a casual game, not a token-gated financial action.
- Scores and personal bests are browser local and can be altered by the player. There is no global leaderboard or prize claim.
- Preview mode is not proof of ownership.
- Public RPC and IPFS availability affect live metadata loading.

## Hackathon disclosure

All application code in this repository was created during this Chogathon work session. The author's previous projects informed the design but no pre-existing application code was copied into this repository. The displayed NFT artwork belongs to its respective rights holders and is loaded from the token's public metadata; the code license does not cover that artwork.
