# Chargehand — Technical Build Plan (execute tonight)

Companion to `prd.md`. Everything below was verified against live docs/registries on Aug 6–7, 2026.

## 1. Settlement: Solana devnet (decided)

Devnet gives identical explorer UX (`?cluster=devnet`) with zero financial/compliance risk. Optional finale: one mainnet Pay.sh call funded with $5 real USDC (first thing to cut).

Setup (once, `scripts/setup-devnet.ts`):

1. **USDC**: Circle's official devnet mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (6 decimals). Faucet: https://faucet.circle.com → USDC → "Solana Devnet" → treasury address (20 USDC per 2h; one request is enough). Fallback: `spl-token create-token --decimals 6` and set `USDC_MINT`.
2. **Keypairs** (base58 secrets in `.env.local`): `TREASURY_KEY` (fee payer + USDC source), `ORCHESTRATOR_KEY`, `SELLER_SUMMARIZE_KEY`, `SELLER_TRANSLATE_KEY`, `SELLER_SENTIMENT_KEY`, `SELLER_BUNDLE_KEY`, `HUMAN_WORKER_KEY`.
3. **SOL**: airdrop 2 SOL to treasury only (`solana airdrop 2 <treasury> -u devnet` or faucet.solana.com). Treasury sponsors every tx (~5k lamports each).
4. **Critical**: pre-create every wallet's USDC ATA (treasury pays rent) and transfer 5 USDC to the orchestrator. `TransferChecked` to a missing ATA is the #1 live-demo killer.
5. RPC: `https://api.devnet.solana.com` default + free Helius devnet endpoint as `RPC_BACKUP`.

## 2. x402 V2 handshake (the exact thing to implement)

Spec: x402 V2 (2025-12-09), SVM scheme: `specs/schemes/exact/scheme_exact_svm.md` in the x402-foundation repo. Three base64(JSON) headers (V1 `X-PAYMENT` is deprecated):

| Step | Direction | Header |
|---|---|---|
| 1 | server → client with HTTP 402 | `PAYMENT-REQUIRED` |
| 2 | client → server on retry | `PAYMENT-SIGNATURE` |
| 3 | server → client with 200/failure | `PAYMENT-RESPONSE` |

**402 body** (`PAYMENT-REQUIRED`): `x402Version: 2`, `resource {url, description}`, `accepts: [{ scheme: "exact", network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" (devnet CAIP-2), amount: "10000" (atomic units = $0.01), asset: <USDC mint>, payTo: <seller pubkey>, maxTimeoutSeconds: 60, extra: { feePayer: <treasury>, memo: "job_<uuid>", recentBlockhash, lastValidBlockHeight } }]`.

**Client tx layout** (facilitator "Path 1", in order): SetComputeUnitLimit → SetComputeUnitPrice → SPL `TransferChecked` (exact amount/mint → payTo's ATA) → Memo (`extra.memo`; replay protection). Fee payer = treasury (slot left unsigned by client); client signs only as transfer authority. Send back base64 partially-signed tx in `PAYMENT-SIGNATURE` with the chosen requirements echoed in `accepted`.

**Server**: verify decoded tx (fee payer isolated, amount/mint/ATA/memo match) → sign as fee payer → submit → confirm at `confirmed` (not `finalized`) → 200 + `PAYMENT-RESPONSE { success: true, transaction: <base58 sig>, network, payer }`. On failure STILL send `PAYMENT-RESPONSE` with `success: false, errorReason`. Keep an in-memory settled-memo cache (duplicate-settlement guard).

**Proof of payment** = the base58 tx signature; receipt link `https://explorer.solana.com/tx/<sig>?cluster=devnet`. The memo (`job_<uuid>`) reconciles tx ↔ marketplace job on-chain.

**Implementation**: self-facilitate in-process with `@x402/svm` (`ExactSvmClient`/`toClientSvmSigner`, `ExactSvmFacilitator`/`toFacilitatorSvmSigner`) — no external facilitator, no signup, spec-exact. Wrappers: `gate402()` (seller, ~50 lines) and `payAndRetry()` (buyer, ~50 lines, hard budget guard refuses to sign above remaining cap). Manual fallback with `@solana/kit` is ~150 lines if the SDK fights us. Do NOT vendor solana-foundation/pay (it's a Rust CLI; the npm package is just a binary wrapper).

## 3. Pay.sh federation (verified live tonight)

`GET https://pay.sh/api/catalog` — free, no auth, CORS `*`, ~50 KB, CDN-cached (s-maxage=60). Schema: `{ version: 2, provider_count: 72, providers: [{ fqn, title, description, category, service_url, endpoint_count, min_price_usd, max_price_usd, ... }] }`. Per-endpoint prices live in markdown at `https://pay.sh/api/{fqn}/index.md`.

Fetch once at boot → map into registry as `type: "external"` nodes (greyed edges on the graph). All Pay.sh listings settle on **mainnet**, so they're display/routing supply in the devnet demo; live-calling one is the mainnet stretch finale.

## 4. Repo structure (Next.js App Router, TypeScript)

```
src/
├── lib/
│   ├── x402/          # types.ts, facilitator.ts, server.ts (gate402), client.ts (payAndRetry)
│   ├── wallet.ts      # signers from env (globalThis singletons)
│   ├── registry.ts    # in-memory listings + seeds + register(); merges pay.sh
│   ├── paysh.ts       # catalog fetch/cache
│   ├── events.ts      # EventEmitter bus + ring buffer (SSE replay)
│   ├── inbox.ts       # human task queue: enqueue/claim/answer, long-poll
│   └── orchestrator.ts# decompose (LLM w/ keyword fallback) → cheapest-in-budget → parallel exec
└── app/
    ├── api/svc/{summarize,translate,sentiment}/route.ts   # 402-gated seed sellers ($0.01–0.02)
    ├── api/svc/research-bundle/route.ts                   # composite: buys 3 sellers ($0.10)
    ├── api/svc/human-expert/route.ts                      # $0.50 → enqueue → long-poll answer
    ├── api/orchestrate/route.ts  # POST {task, budgetUsd}
    ├── api/registry/route.ts     # GET listings / POST self-serve registration
    ├── api/inbox/route.ts        # GET open / POST claim / POST answer
    ├── api/events/route.ts       # SSE ReadableStream
    ├── page.tsx                  # market graph + task launcher + budget bar + receipts
    ├── inbox/page.tsx            # human worker UI (phone)
    └── sell/page.tsx             # self-serve listing form
```

Decisions:
- **Graph**: `react-force-graph-2d` (dynamic-import, `ssr: false`) — `linkDirectionalParticles`/`emitParticle` gives the payment-pulse animation for free.
- **SSE, not WebSockets** (App Router can't upgrade to WS without a custom server). Typed events: `payment_required`, `payment_settled {sig, from, to, amountUsd, explorerUrl}`, `task_claimed`, `listing_registered`. Ring-buffer replay on connect; keep-alive comments every 15s.
- **State in-memory** behind `globalThis`; demo on `next build && next start` (single process), never dev mode on stage.
- **Orchestrator**: LLM decomposition (`ai` SDK `generateObject`) only if a key is set; deterministic keyword table otherwise (`summar→summarize`, `translat→translate`, `expert|opinion|human→human-expert`, default→research-bundle). Same plan shape both ways — the demo never depends on an LLM. Human branch runs in `Promise.all` with API branches; auto-answer fallback after N seconds (env) so the run always completes.

Packages (verified on npm): `next@16.3.0`, `react@19.2.8`, `@solana/kit@7.0.0`, `@solana-program/token@0.15.0`, `@solana-program/system@0.13.0`, `@solana-program/memo@0.12.0`, `@solana-program/compute-budget@0.17.0`, `@x402/core@2.21.0`, `@x402/svm@2.21.0`, `react-force-graph-2d@1.29.1`, `bs58@6.0.0`, `tsx` (dev); optional `ai@7.0.55` + `@ai-sdk/openai`.

## 5. Build order and cut lines

1. **P0 — money moves**: setup script, x402 lib, one seller, one hardcoded buyer call. Exit test: curl → 402 → pay → 200 + resolving explorer link. Nothing else matters until this works.
2. **P1 — marketplace loop**: registry + seeds, orchestrator (keyword fallback) + budget cap, 3 sellers, receipts.
3. **P2 — the show**: SSE + force graph + payment particles + budget bar.
4. **P3 — humans**: human-expert route + inbox pages.
5. **P4 — depth**: composite listing; `/sell` registration.
6. **P5 — garnish**: LLM decomposition; Pay.sh federation; mainnet finale.

Cut order if time runs out: mainnet finale → Pay.sh federation → `/sell` UI (keep the POST API, register via curl on stage) → composite listing → LLM decomposition. **Never cut P0–P3.**

## 6. Top risks

1. **Live settlement** — mitigations: self-facilitation, pre-created ATAs, server-supplied blockhash, `confirmed` commitment, settled-memo cache, `RPC_BACKUP`, and a `MOCK_SETTLEMENT=1` flag that fakes signatures (loses explorer links, keeps the whole show) so the demo can never die on stage.
2. **In-memory state / SSE under Next** — `globalThis` singletons, production build on stage, ring-buffer replay, keep-alives.
3. **Human beat blocking** — parallel branches, generous long-poll, auto-answer fallback, rehearse the phone flow twice.

Pre-demo checklist: treasury has SOL · orchestrator has USDC · all ATAs exist · one full run recorded as backup video · `MOCK_SETTLEMENT` tested · rehearsed twice (venue wifi + phone hotspot).
