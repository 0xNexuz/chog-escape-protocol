# Project Context

## Project identity

- **Name:** Chog Escape Protocol
- **Repository:** https://github.com/0xNexuz/chog-escape-protocol (public)
- **Production:** https://chog-escape-protocol.vercel.app
- **Description:** Daily tactical Chog NFT heist
- **Stage:** SUBMISSION PREPARATION
- **Status:** DEPLOYED and live flow VERIFIED
- **Updated:** 2026-10-23

## Git state

- **Local branch:** main; local commit `d807a46`
- **GitHub main:** browser commits, latest deployed `f39b490` (API addition). Browser upload was used because local Git authentication and TLS verification failed, so local and remote commit graphs differ.
- **Last verified milestone:** Vercel production app, live NFT API, browser preview movement, game logic tests

## Hackathon context

- **Competition:** [Chogathon 2026](https://chogathon.chog.xyz/)
- **Deadline:** The official page showed about 20 hours remaining when work began on 2026-10-22; exact timestamp and time zone not independently captured.
- **Requirement:** Chog NFT essential to experience.
- **Judging:** Novelty 30%, Fun 20%, Retention 20%, Clarity 15%, Execution 15%; meaningful optional $CHOG integration may earn bonus.
- **Deliverables:** Project/team details, description, why Chog matters, working demo, video up to 3 minutes, testing instructions, repository/stack/pre-existing work, feedback and next steps.
- **Source:** Official event page linked above, read live in browser on 2026-10-22.

## Strategy and decisions

- **Selected direction:** Chog Escape Protocol, APPROVED by user's authorization to run the entire discovery-to-deployment workflow and choose the idea.
- **Reason:** Makes ownership, traits, and token identity mechanically essential while providing a playable 90-second demo and daily retention loop.
- **Alternatives considered:** NFT storytelling theater, cooperative cipher, generic trait battle, and NFT creator tool. They lost on verified access, 20-hour feasibility, or demo clarity.
- **Target users:** Chog holders and curious non-holders using transparent preview.
- **Stack:** Vanilla web frontend, pure JS game engine, Node serverless function, Monad JSON-RPC and public IPFS metadata.
- **Security assumptions:** No token transaction or private key; public ownership check for casual game access; local score is not a secure leaderboard.

## Progress and verification

- **Implemented:** Onchain `ownerOf` / `tokenURI` lookup, allowlisted trait metadata, wallet connection and owner match, daily deterministic maze, distinct NFT abilities, traps/drones/fragments/exit, keyboard and touch controls, local personal best, preview disclosure, responsive UI.
- **Verified:** `npm test` passed 3 tests locally. Direct `getNft(973)` returned live owner and traits. The Vercel production app loaded; its `/api/nft?id=533` returned owner, real metadata, chain 143, and collection contract. Public UI loaded token IDs 973 and 533 with distinct Firestorm/Laser powers, started a preview run, accepted movement, and advanced the turn counter. GitHub main contains app and API code.
- **Unverified:** A complete win flow in browser and wallet owner flow with an actual holder wallet. Demo video and official submission remain outstanding; the user asked to submit personally.
- **Known issue:** Public IPFS gateway occasionally takes over 9 seconds; timeout was raised to 20 seconds and live lookup then succeeded. Availability remains external dependency.

## Decision log

### 2026-10-23 — Remove recording script

- **Decision:** Remove the recording script document and both README references at the user's request.
- **Scope:** Documentation only; gameplay, live app links, submission draft, and existing verification evidence are preserved.
- **Verification:** Checked that the README no longer refers to the removed document. No application behavior changed.

### 2026-10-22 — Select daily NFT heist

- **Decision:** Build Chog Escape Protocol with transparent preview and owner-verified live play.
- **Reason:** Official judging emphasizes novelty, fun, retention, clarity, and execution, and requires the NFT to matter.
- **Alternatives:** Story theater, cooperative cipher, trait battle, creator tool.
- **Evidence:** Official Chogathon page, live Chog Genesis metadata, and local gameplay checks.
- **Status:** APPROVED by user scope.

## Next action

1. Add documentation to GitHub and prepare a ≤3-minute demo video if possible.
2. Give the user copy-ready submission text. They will enter their own team/handle details and submit themselves.

**Authorization:** User explicitly authorized full GitHub and Vercel deployment, but subsequently clarified they will perform the official form submission. Credentials, wallet transactions, and spending are not needed for the MVP.
