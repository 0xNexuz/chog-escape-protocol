# Project Context

## Project identity

- **Name:** Chog Escape Protocol
- **Repository:** https://github.com/0xNexuz/chog-escape-protocol (public)
- **Production:** https://chog-escape-protocol.vercel.app
- **Description:** Daily tactical Chog NFT heist
- **Stage:** SUBMISSION PREPARATION
- **Status:** Public baseline deployed; final-pass release branch prepared locally
- **Updated:** 2026-10-23

## Git state

- **Local branch:** `release-final-polish` from GitHub `main` at `5b8a7cf`; the separate local `final-polish` commit `25c50ec` preserves the prior documentation edits and implementation work.
- **GitHub main:** latest fetched `5b8a7cf`. Its newer README and decision to remove a separate recording-script document were preserved. The original local root `d807a46` and GitHub history remain separate.
- **Last verified milestone:** Vercel baseline app and live NFT API; local final-pass tests and browser preview interaction. The public deployment does not include final-pass changes yet.

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

- **Implemented locally in final pass:** Seeded Fisher–Yates generation with static route slack; structured power/damage/fragment/outcome events; balanced drone cadence and hit shield; fresh owner recheck at verified run start; stale-request and wallet-change handling; distinct preview/sample/verified labels and records; local daily bests, badges, three-day successful-run streak, expanded text share and branded PNG; mobile controls/HUD and reduced-motion styles.
- **Verified:** `npm test` passed 17 tests on 2026-10-23, including 360 token/date/trait seeds with static route length at most 38 turns and nine representative dynamic win searches with traps, drones, and powers. The local homepage, CSS, and NFT API each returned anonymous HTTP 200. A desktop browser loaded live metadata, started preview, and advanced by keyboard. Earlier mobile layout testing at 375px showed no horizontal overflow.
- **Unverified:** A complete win/loss in browser and wallet owner flow with an actual holder wallet. Demo video and official submission remain outstanding; the user asked to submit personally and requested no video creation by the agent.
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

1. Publish the reviewed final-pass branch and verify the public deployment; no video is to be created by the agent.
2. Give the user copy-ready submission text. They will enter their own team/handle details and submit themselves.

**Authorization:** User authorized full GitHub and Vercel deployment and reiterated “you have perms” after the final diff/test evidence was presented. They will perform official form submission. Credentials, wallet transactions, and spending are not needed for the MVP.
