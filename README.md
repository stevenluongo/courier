# Chargehand — the general contractor for AI agents

Give an AI agent one USDC budget on Solana and it hires whoever's best for the job — paid APIs, other agents, or human beings — paying per unit of work, with one receipt for the whole job.

Built at Cursor Miami: Ship Night. See `prd.md` (locked PRD) and `BUILD_PLAN.md`.

## Run it

```bash
npm install
npm run build
npm start          # production mode — use this on stage, not `npm run dev`
```

- **Big screen**: http://localhost:3000 — market graph (72 live providers federated from Pay.sh + seeded sellers + one human worker), reasoning console, budget bar, receipts.
- **Worker phone**: http://localhost:3000/worker — open on the worker's phone (same network; use the machine's LAN IP). Shows profile, wallet badge, balance; receives the job push, opens the camera, gets paid on delivery.

## The demo

Type (or keep) the task **"How many people are at Ship Night right now?"**, budget $5, hit Run:

1. Agent posts its 5-step plan, buys an event lookup + attendance baseline from a Pay.sh-federated search seller ($0.04).
2. Realizes no API can observe a private venue → **hires the registered human worker** ($1.50). Their phone buzzes.
3. Worker shoots the room, delivers; payment releases; the photo lands in the run.
4. Agent refuses the over-budget vision seller (budget enforced in code), hires the cheap one ($0.40), counts heads.
5. Answer + receipt: total spent, unused budget returned, every worker listed — one of them human.

Any other task takes a generic research path, so judge-typed tasks always produce a run.

## Config (`.env.local`, all optional)

| Var | Effect |
|---|---|
| `OPENAI_API_KEY` | Real head-count via vision model; otherwise a plausible mock is used |
| `MOCK_HEADCOUNT` | The mocked count (default 187 — set to your actual eyeball count) |
| `AUTO_PHOTO_MS` | Failure insurance: auto-continue the human step after N ms (0 = wait forever) |
| `NEXT_PUBLIC_WORKER_NAME` | The human worker's display name |

## Honest footnotes

- Settlement is **simulated** tonight (mock signatures); routing, budget enforcement, the 402 job flow, and the Pay.sh federation (bundled snapshot of the live catalog) are real. The x402 V2 Solana settlement design is specced in `BUILD_PLAN.md`.
- The worker page keeps the last capture in localStorage — take a backup photo before the demo and the "Use last capture" button becomes your wifi insurance.
