Bazaar — the marketplace where AI hires
One-liner: Give an AI a task and it hires whatever it needs — data, compute, real-world actions, even people — paying per request in USDC on Solana. No signup, no API keys, no human in the loop.

1. Problem
AI can think, but it can't buy anything.

Every tool an agent can reach was wired up in advance by a human who signed up for a service, got a key, and put a credit card on file. That's the ceiling on what agents can do: not intelligence, but purchasing. An agent that needs a capability nobody pre-arranged for it simply fails.

It's a money problem wearing a technology costume. Banks don't issue accounts to software. Cards can't process a third of a cent — the fee exceeds the charge. So every AI-to-service connection requires a human, a contract, and a minimum transaction size, and none of those scale to millions of agents making millions of tiny purchases.

2. Solution
An open market where agents discover services, compare posted prices, pay per request, and get work back — in one round trip, with no account relationship on either side.

The loop:

Agent needs a capability it doesn't have.
It queries the registry for listings matching that capability, with prices.
It selects one — cheapest, or best value within its budget.
It calls the endpoint and receives 402 Payment Required with a price and address.
It pays USDC on Solana. Sub-second, fees sponsored.
It retries with proof of payment and gets the work.
Sellers list a capability, an endpoint, and a price. That's the entire onboarding — no contract, no invoicing, no sales call, no knowledge of crypto required beyond an address to be paid at.

Why this has to be crypto, in one sentence: software needs to hold money and pay other software in fractions of a cent, instantly, with no account relationship — and there is no other mechanism that does all four.

3. Users
Buyers: anyone building agents that keep hitting the wall of "it can only use the tools I hand-wired."

Sellers: developers with a useful capability, niche data owners, and — distinctively — humans selling micro-work to machine customers. A person who verifies a photo in 60 seconds for five cents is a valid listing, and that's how the market handles everything AI can't do.

4. Business case
Model: take rate on gross marketplace volume, 2–5%. Marketplaces don't need an invented business model.

Flywheel: more listings make the market more useful to agents → more agent spend attracts more sellers → more coverage means agents route more work through the market rather than failing. Agent demand is growing on its own; we're not creating it, we're capturing it.

The novel supply side: a solo developer can put a capability online with a price and earn from customers who are software, with no sales process. That's a new income surface that didn't exist, and it's the part of the story that makes people care beyond the tech.

Market: x402 handled roughly 165M agent transactions and ~$50M cumulative volume by April 2026, with Solana carrying about half of it. The rail is real and growing fast. What doesn't exist on top of it is a market with discovery, price competition, quality signal, and human supply.

Why we're not just Pay.sh or x402. x402 is a payment protocol — the handshake, not the market. Pay.sh (Solana Foundation and Google Cloud, launched May 2026) is the closest thing: a directory where agents discover paid APIs. It's a catalog. What a market needs and a catalog doesn't have is reputation and routing (which seller actually returns good work), refunds on failure (an agent that pays for garbage should get its money back), human sellers, composite listings (agents reselling agents), and budget policy (spend rules the agent can't exceed). We build on the rail rather than competing with it — and the reputation layer is the part that's defensible, because it can only be earned over transaction history.

Competition generally: Stripe, Coinbase, Visa, and Google have all shipped rails in this direction. Rails commoditize. The market and the trust layer on top is a different business, and it's the one that keeps its margin.

5. Product
Core flows

GET /listings?capability= — discover services with posted prices
402 payment handshake, then delivery on retry with proof
USDC settlement on Solana, fees sponsored so nobody holds SOL
Self-serve listing: capability, endpoint, price, payout address
Orchestrator SDK: decompose a task, route on price within a budget cap
Live graph of the market — nodes, edges, dollars moving
Roadmap: reputation scores from transaction history · escrow with refund-on-failure · human-worker listings with instant payout · budget and allow-list policies · counteroffer negotiation

6. Scope tonight
In: listing registry with posted prices · 402 handshake · real USDC settlement on Solana with sponsored fees · orchestrator that decomposes a task and selects on price inside a budget cap · self-serve listing registration · live market graph · five seeded listings — one sub-cent data lookup, one compute job with visible output, one SMS send, one human-in-the-loop, one composite agent that resells three others

Out, explicitly: reputation · escrow and refunds · fiat on-ramp · accounts and auth · negotiation · any chain but Solana · seller payout scheduling

7. Demo (3 min, live)
Graph already moving on screen. Don't explain it.
Take a task from a judge, out loud.
Agents route, pay, and return work — dollars crossing the graph while you narrate.
Budget beat: take the cheapest seller offline mid-run. The orchestrator refuses the expensive one because it breaks the budget cap, and finds a third. A market clearing in real time.
Human beat: a listing gets hired and a person in the room answers it and gets paid.
Audience beat: someone registers their own listing live, and thirty seconds later software that had never heard of them has hired and paid them.
Receipt: agents involved, paid calls, total cost in cents, explorer link. "No contracts, no API keys, no accounts. Agents can't get bank accounts — and they never will."
8. Stack and partners
Solana + USDC for settlement, x402-style handshake. QuickNode for RPC and webhook confirmations feeding the live graph — one transaction per paid call, so real throughput. OKX for seller cash-out and self-custody. Fee sponsorship so no participant needs SOL. Built end to end in Cursor.

9. Risks
Risk	Mitigation
Cold start — no sellers, no market	Seed five listings; live audience registration is the proof supply can grow
Sellers returning garbage or scamming	Reputation from transaction history, escrow with refund-on-failure (30-day priority)
Prompt injection via listing responses	Treat all seller output as untrusted data, never instructions; sandbox and schema-validate
Pay.sh or a platform absorbing the category	Build on the rail; own reputation, human supply, and routing
Custody of marketplace funds	Non-custodial escrow, direct seller settlement, no funds on our books
Sub-cent unit economics	Only viable on a chain with near-zero fees and sub-second finality
10. Self-described milestones
2 weeks — mainnet-beta deploy, repository open-sourced, 25 live listings, 1,000 paid calls, weekly public updates started
30 days — reputation scores and refund-on-failure escrow live, 100 listings
60 days — human-worker listings with instant payout, first $1,000 of marketplace volume
90 days — budget policies and a published agent SDK, 10,000 paid calls per week
11. Success metrics
Tonight: paid calls settled, dollars moved, listings registered by people who aren't us.

Ongoing: share of volume going to third-party listings — the number that proves it's a market and not a demo — plus repeat buyers and refund rate.

12. Why this team
We shipped a working version in a single evening. The grant asks for projects that yield results quickly and are executable by the proposing team; the product is the evidence for both. We intend to open-source shortly after mainnet deploy.

