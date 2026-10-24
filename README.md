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

The rate is specified per minute and accrued pro-rata by the second:

```text
earned = min(deposit, elapsedSeconds × pricePerMinute ÷ 60)
refund = deposit − earned
```

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- wagmi, viem, RainbowKit
- Solidity 0.8.28, Hardhat, OpenZeppelin `ReentrancyGuard`
- Monad Testnet — chain ID `10143`

## Project structure

```text
app/                         Next.js routes
  create/                    Tutor offer creation
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

1. **Tutor wallet:** create `Calculus · Derivatives` at `0.5 MON/min` and copy the session URL.
2. **Student wallet:** open the URL and deposit `2 MON`.
3. **Student:** click **Start payment stream**. Show the live timer and both balances moving.
4. Wait 30–60 seconds, then click **End & settle now** from either participant.
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
