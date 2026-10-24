# ProofStream

**Real-time tutoring payments + on-chain skill proofs + portable tutor reputation on Monad.**

ProofStream lets a student escrow native testnet MON, pay a tutor pro-rata for elapsed session time, reclaim the unused balance, and co-sign a lightweight on-chain proof of learning. Every finalized proof increments the tutor's public reputation score.

> Monad Blitz MVP. The code is designed for a clear live demo and has not been professionally audited.

## The differentiator

Most payment demos stop at settlement. ProofStream turns the completed session into a verifiable outcome:

- **Student:** receives an event-based record linking their wallet, subject, tutor, and duration.
- **Tutor:** gains one point of on-chain reputation per finalized proof.
- **Both:** use non-custodial smart-contract escrow instead of trusting a platform database.

All payment, timing, attestation, proof, and reputation logic lives in `ProofStream.sol`.

## Features

- Tutor creates a priced learning session and shares its URL.
- Student deposits native MON into the contract.
- Student starts the session; the UI shows live elapsed time, accrued pay, and refundable balance.
- Either participant ends the active session.
- Settlement atomically pays the tutor and refunds the student.
- Student and tutor independently attest after settlement.
- Two attestations immediately emit `SkillProofMinted` and increment reputation.
- If only one participant attests, that participant can finalize after the five-minute timeout.
- Home screen lists recent open sessions and current tutor proof counts directly from contract state.
- Students browse a four-category MIT class catalog and choose an available tutor stream.
- The linked YouTube lecture mounts and autoplays only while the on-chain stream has spendable escrow.
- An empty escrow pauses and blanks the player; the student can top up the active session on-chain.
- Deposits use transparent, decreasing platform fees with a two MON minimum.

The rate is specified per minute and accrued pro-rata by the second:

```text
earned = min(deposit, elapsedSeconds × pricePerMinute ÷ 60)
refund = deposit − earned
```

Catalog offers default to `0.2 MON/second`, stored by the contract as `12 MON/minute` and accrued pro-rata every second.

## Course catalog

| Category | Course |
| --- | --- |
| Programming & Computer Science | MIT 6.100L Introduction to CS and Programming using Python |
| Finance & Economics | MIT 14.01 Principles of Microeconomics |
| Biology & Life Sciences | MIT Introductory Biology |
| Neuroscience | MIT 9.13 The Human Brain |

The catalog and video identifiers are public frontend metadata in `lib/courses.ts`. Session creation, student identity, escrow, timing, payout, refund, fees, proof, and reputation remain on-chain.

### On-chain deposit plans

| Gross deposit | Platform fee | Net session escrow |
| ---: | ---: | ---: |
| 2 MON | 10% | 1.8 MON |
| 5 MON | 7% | 4.65 MON |
| 10 MON | 5% | 9.5 MON |
| 20 MON | 3% | 19.4 MON |

The contract transfers the fee to `platformTreasury` during the deposit transaction. The same student may top up a funded or active stream. Larger payments receive the lower fee automatically from the contract; the UI does not control fee calculation.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- wagmi, viem, RainbowKit
- Solidity 0.8.28, Hardhat, OpenZeppelin `ReentrancyGuard`
- Monad Testnet — chain ID `10143`

## Project structure

```text
app/                         Next.js routes
  create/                    Tutor offer creation
  course/[slug]/             Course details + matching tutor streams
  deposit/[id]/              On-chain plan selection and active top-up
  session/[id]/              Live payment + attestation experience
components/                  Navigation and on-chain session feed
contracts/ProofStream.sol    Escrow, settlement, proof, reputation
lib/                         Monad config and typed contract ABI
scripts/deploy.cjs           Testnet deployment
test/ProofStream.cjs         Lifecycle, proof, timeout, authorization tests
```

## Local setup

Requirements: Node.js 20+, pnpm 11+, and browser wallets for tutor and student.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a WalletConnect project ID and set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. A proper project ID is recommended for the demo even though injected wallets can work locally.

### Open the interface with VS Code Go Live

The repository root also contains a dependency-free static UI preview:

1. Open this folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html` and choose **Open with Live Server**, or click **Go Live** in the status bar.

The static preview simulates deposit, streaming, settlement, and mutual attestation in the browser so the complete interface can be presented without starting Node.js. It never sends wallet transactions. Use the Next.js application above for the real wagmi wallet flow and on-chain ProofStream contract calls.

### Visual token-plan demo

The token-plan control next to **Connect wallet** is presentation-only. It offers `2,500 TOK / ₺200`, `5,000 TOK / ₺350`, and `Unlimited / ₺1,000`, and keeps the selected demo balance in the browser's local storage. It never charges TL, mints a token, or changes the smart contract.

The same modal includes two visual settlement stories:

- **MON settlement:** credits represent access rights while tutor earnings remain native MON.
- **StudyToken settlement:** the interactive static demo displays tutor earnings and the remaining plan balance in STC.

These modes exist only to compare product concepts during the pitch. Real on-chain session settlement remains native MON.

## Compile and test

```bash
pnpm contract:compile
pnpm contract:test
pnpm typecheck
pnpm build
```

The tests cover:

- Pro-rata payment and refund math
- Proof issuance after both attestations
- Reputation increment exactly once
- One-sided proof finalization after timeout
- Unauthorized start/end rejection
- Minimum deposit enforcement
- Decreasing commission tiers and treasury payment
- Active stream top-ups by the original student

## Deploy to Monad Testnet

Create a root `.env` file:

```dotenv
PRIVATE_KEY=0xYOUR_TESTNET_ONLY_DEPLOYER_KEY
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

Never commit this key. Fund the deployer with testnet MON from the [Monad faucet](https://faucet.monad.xyz), then run:

```bash
pnpm contract:deploy
```

The course/top-up release changes the session struct and deposit accounting. Deploy a fresh contract for this version; an address from the earlier MVP is not ABI-compatible.

Copy the printed address into `.env.local`:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0xDEPLOYED_CONTRACT
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_REOWN_PROJECT_ID
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

Restart Next.js after changing `NEXT_PUBLIC_*` values.

### Network details

| Setting | Value |
| --- | --- |
| Network | Monad Testnet |
| Chain ID | `10143` |
| Native token | `MON` |
| Public RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | [testnet.monadscan.com](https://testnet.monadscan.com) |
| Faucet | [faucet.monad.xyz](https://faucet.monad.xyz) |

## 60-second demo script

1. **Tutor wallet:** choose `MIT 6.100L Introduction to CS and Programming using Python`, keep the `0.2 MON/sec` demo rate, and create the offer.
2. **Student wallet:** open the course, choose the tutor, and deposit the `2 MON` Starter plan (`1.8 MON` net escrow).
3. **Student:** click **Start payment stream**. Show the MIT lecture appear while the live timer and both balances move.
4. Let the short starter balance run out to show the player pause, then use **Deposit more MON** to resume. End from either participant when ready.
5. Show the settled tutor payment and student refund in Monadscan.
6. **Student wallet:** click **Attest this session**.
7. **Tutor wallet:** connect and attest. The UI switches to **Skill proof recorded**, and tutor reputation increases by one.
8. Open the final transaction and highlight the `SkillProofMinted` event.

Pitch: “Students leave with verifiable proof. Tutors build portable reputation. Monad makes the short, low-value interactions viable.”

## Contract lifecycle

```text
Open → Funded → Active → Ended → Proof issued
          student starts   both attest (or one + timeout)
```

`endSession` follows checks-effects-interactions and uses `ReentrancyGuard`. Earnings can never exceed escrow. A failed tutor payout or student refund reverts the whole settlement.

The “stream” is continuous accrual derived from on-chain timestamps; native MON is transferred at settlement because smart contracts cannot autonomously send transactions in the background.

## Production hardening

Before handling real value, add a professional audit, pull-payment fallback for recipients that reject native MON, a longer governance-reviewed timeout policy, indexed session discovery, dispute handling, and explicit protocol upgrade/versioning strategy.
