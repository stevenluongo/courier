# Chargehand — the general contractor for AI agents

One-liner: Give an AI agent one USDC budget on Solana and it hires whoever's best for the job — paid APIs, other agents, or human beings — paying per unit of work through the x402 handshake, with one receipt for the whole job. No signup, no API keys, no invoices.

Refrain: **One budget, any worker — human or machine.**

> Renamed from "Bazaar" — Coinbase's x402 discovery layer is already called Bazaar. "Chargehand" (the worker who runs the crew) is collision-checked clean: **charge** = a payment, **hand** = a hired hand.

## 1. Problem

AI can think, but it can't buy anything — and it definitely can't hire anyone.

Every tool an agent can reach was wired up in advance by a human who signed up, got a key, and put a card on file. That's the ceiling on what agents can do: not intelligence, but purchasing. And when the best worker for a sub-task is a *person* — a fact-check, a photo verification, a judgment call — the agent has no way to hire them at all.

It's a money problem wearing a technology costume. Banks don't issue accounts to software. Cards can't process a third of a cent. So every AI-to-service connection needs a human, a contract, and a minimum ticket size — and none of that scales to millions of agents making millions of tiny purchases.

## 2. Solution

A general contractor. The agent hands Chargehand a task and a budget cap. Chargehand decomposes the task, shops a registry of priced listings — machine and human — hires the best worker for each piece via the x402 payment handshake (HTTP 402 → pay USDC on Solana → retry with proof → receive work), enforces the budget in code, and returns the assembled result with one receipt: every worker, every payment, every explorer link.

The loop per sub-task:

1. Query the registry for listings matching the needed capability, with posted prices.
2. Select the best worker within the remaining budget — API, agent, or human.
3. Call the endpoint; receive `402 Payment Required` with price and address.
4. Pay USDC on Solana. Sub-second, fees sponsored — no participant holds SOL.
5. Retry with proof of payment; receive the work.

Sellers — including humans — list a capability, an endpoint (or an inbox), a price, and a payout address. That's the entire onboarding.

Why this must be crypto, in one sentence: software needs to hold money and pay other software *and people* in fractions of a cent, instantly, with no account relationship — and no other mechanism does all four.

## 3. What's genuinely new (verified competitive position, Aug 2026)

We researched this honestly. What already exists:

- **Catalogs & discovery**: Pay.sh (Solana Foundation + Google Cloud — 72 providers), Coinbase x402 Bazaar, OpenDexter (5,000+ endpoints, reputation scores), x402Scout (trust-scored registry + single-call routing).
- **Single-call routers**: Agent402 (route one call, refund on failure — Base/Algorand only).
- **Orchestrators**: CleverCon (decompose + budget vault — Stellar testnet, humans "future work"), AIP (Solana beta, tiny), AgentBazaar (Stellar testnet demo).
- **Humans-for-agents platforms**: HireForHumans, h402, HumanOps, HumanRail, RequestHuman — all human-only silos, all on Base/Polygon/Lightning. None on Solana, none mixed with API supply.

**What nobody anywhere has shipped: one budget-governed run that hires APIs, agents, and humans through the same 402 handshake, on Solana, with the subcontract graph visible.** That is Chargehand's claim. Supporting lines, not headlines: failed calls are never charged and unused budget is returned (the x402 escrow scheme is EVM-only today — a Solana-side "pay only for delivered work" guarantee is unclaimed); composite listings (agents reselling agents) with a *transparent* subcontract chain on the graph.

We don't compete with the catalogs — we federate them. Pay.sh's 72 live providers are ingested as supply on day one. Pay.sh built the catalog; Chargehand is the contractor that shops it. A contractor generates demand for the ecosystem's own rails.

## 4. Users

**Buyers:** anyone building agents that hit the wall of "it can only use tools I hand-wired" — and the new wall behind it, "it can't hire a human when the task needs one."

**Sellers:** developers with a capability, niche data owners, other agents — and, distinctively, people selling micro-work to machine customers. A person who fact-checks a claim in 90 seconds for $1.50 is a listing on equal footing with a Google API, paid from the same budget, on the same receipt. That's a new income surface, and it's the inclusive-finance story: anyone with a phone and a Solana address can earn from the agent economy tonight.

## 5. Business case

Model: take rate on gross marketplace volume, 2–5%. Contractors take a cut of the job; marketplaces don't need an invented business model.

Market evidence (verified): x402 processed ~174M payments and ~$49M USDC through April 2026; Solana carries ~50% of transaction traffic; the x402 Foundation sits under the Linux Foundation with Coinbase, Cloudflare, and Stripe as founding members; Mastercard, Visa, PayPal, and Google have all shipped agentic-payment infrastructure; Juniper forecasts $1.5T of agentic commerce by 2030 (McKinsey: $3–5T). The rail is real. What's missing on top of it is the layer that takes responsibility for a whole job — decomposition, mixed hiring, budget enforcement, one receipt. That's the layer that keeps its margin when rails commoditize.

Flywheel: more listings (machine and human) → agents route more work through the market instead of failing → more spend attracts more sellers. Agent demand is growing on its own; we capture it, we don't create it.

## 6. Product

Core flows:

- `GET /registry?capability=` — priced listings: seeded local sellers, federated Pay.sh providers, self-registered sellers, human workers
- 402 handshake per hire; delivery on retry with proof; USDC on Solana, fees sponsored
- Orchestrator: decompose task → select by price within a hard budget cap (enforced in code, not in a prompt) → parallel execution across machine and human branches
- Human inbox: a person's phone buzzes with a job offer from software; they answer; USDC lands in their wallet
- Self-serve listing: capability, endpoint, price, payout address — live in the graph in seconds
- Composite listings: a seller that subcontracts other sellers, margin visible on the graph
- Live market graph: every node a worker, every edge pulse a real payment, explorer-linked receipts

Roadmap: reputation from transaction history · escrow with refund-on-failure as a Solana-side x402 scheme · negotiation/counteroffers · budget policies as a standalone SDK · fiat payout for human workers.

## 7. Scope tonight

**In:** registry with 5 seeded listings (data lookup · compute with visible output · sentiment · one human fact-checker · one composite that resells three others) · x402 V2 handshake, self-facilitated · real USDC settlement on Solana devnet with sponsored fees and explorer receipts · orchestrator with budget cap and price routing (LLM decomposition with a deterministic fallback — the demo never depends on an LLM) · human inbox on a phone · self-serve registration · live market graph (SSE + force graph with payment particles) · Pay.sh catalog federated as display/routing supply.

**Out, explicitly:** reputation · true escrow program · fiat on-ramp · accounts/auth · negotiation · other chains · payout scheduling.

## 8. Demo (3 minutes, live — timed script)

Pre-stage: graph live with background traffic; self-serve QR on screen the whole time; volunteer with the worker inbox open on a phone; wallets pre-funded; one full run recorded as backup.

- **0:00 Cold open on the moving graph.** "Every dot is a worker — paid APIs, AI agents, and human beings. Every line is a real USDC payment on Solana, happening right now. This is Chargehand: the general contractor for AI agents."
- **0:20 Take a task from a judge.** Budget: $5. Plant the audience ask now: "scan that QR, list any skill, name your price."
- **0:40 Route & pay.** Edges light up per hire. "This supply isn't ours — we federated Pay.sh, the Solana Foundation and Google Cloud's catalog. They built the catalog; we built the contractor that shops it. No API keys. The payment *is* the credential."
- **1:15 Budget beat.** Kill the cheapest seller live. Next quote is over budget — the agent *refuses*, re-shops, hires the third option. "The cap is enforced in code, not in a prompt."
- **1:45 Human beat.** The fact-check routes to a person in the room. Their phone buzzes; they accept; $1.50 of USDC lands. "One budget, any worker — human or machine."
- **2:15 Audience beat.** Whoever scanned the QR at 0:30 has already been hired by software that never heard of them.
- **2:40 Receipt.** Six workers, every payment a Solana transaction, explorer links — "verify it from your seat."
- **2:55 Close.** "Agents will never get bank accounts. As of tonight, they don't need them — they can hire. Chargehand. It's live."

## 9. Stack and partners

Solana devnet USDC (Circle's official devnet mint) via the x402 V2 `exact` SVM scheme, self-facilitated with `@x402/svm` — treasury keypair sponsors all fees so nobody holds SOL. QuickNode/Helius RPC. Pay.sh catalog federated as supply. Next.js + SSE + force-graph frontend. Built end to end in Cursor. See `BUILD_PLAN.md` for the full technical plan, build order, and cut lines.

## 10. Risks

| Risk | Mitigation |
|---|---|
| On-chain settlement fails on stage | Self-facilitation (no third party), pre-created ATAs, backup RPC, `confirmed` commitment, `MOCK_SETTLEMENT` escape hatch |
| "Isn't this CleverCon / Agent402 / OpenDexter?" | Lead with the mixed human+machine run on Solana — verified unclaimed; never lead with discovery/routing |
| Human beat blocks the run | Human branch runs in parallel; long-poll timeout with auto-answer fallback; rehearsed twice |
| Cold start | Seeded listings + 72 federated Pay.sh providers + live audience registration as proof supply grows |
| Prompt injection via seller output | Seller output is data, never instructions; schema-validated |
| Custody | Demo treasury only; roadmap is non-custodial escrow, no funds on our books |

## 11. Success metrics

Tonight: paid hires settled on-chain, dollars moved, a human paid live, listings registered by people who aren't us.

Ongoing: share of volume to third-party listings (the number that proves it's a market, not a demo), repeat buyers, human-worker payout volume.

## 12. Why this team

We shipped a working version in a single evening, and the competitive research in this document is our own. The grant asks for projects that yield results quickly and are executable by the proposing team; the product is the evidence for both. Open-sourcing after mainnet deploy.
