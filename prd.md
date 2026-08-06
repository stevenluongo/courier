# Courier — send money to a name, not an address

**One-liner:** Type `/send @alex 20` in any chat. Alex has it a second later — no wallet, no app, no signup.

---

## 1. Problem

Every payment app is a walled garden. To pay someone, they must already be on your app: account opened, identity verified, bank connected. If they're not, the payment doesn't happen — you fall back to "I'll get you next time," or to a wire, or to Western Union at 6%.

Crypto was supposed to fix this and made it worse. You now need a wallet, a seed phrase, a native token for gas, and the willingness to paste a 44-character address into a chat and hope you got it right. The people who most need cheap, instant, borderless money movement are exactly the people who will never do any of that.

## 2. Solution

A Telegram bot that moves money by @handle.

You send to a person, not an address. If the recipient has nothing, a wallet is created for them in the act of receiving — no install, no seed phrase, no signup. Fees are sponsored, so people transact in dollars and never learn what SOL is. The money is real, it settles in under a second, and it costs a fraction of a cent.

**Why this can't be built on bank rails:** paying someone who isn't already a user requires them to open an account and pass KYC first. A stablecoin wallet can be created *in the moment money arrives*, for anyone, anywhere, at effectively zero marginal cost. That single property is the entire product.

## 3. Users

**Wedge:** people who already send money inside group chats — friends splitting costs, families sending money home, online communities paying contributors.

**Expansion:** any business that needs to pay many small amounts to many people across many countries.

## 4. Business case

**The flywheel:** most users never fund a wallet — they get paid, then pay onward. One person on-ramps and their whole chat is seeded for free. Acquisition cost is one on-ramp per social cluster, not per user. Businesses paying out create consumer users as a byproduct, and those users transact with each other. The B2B side buys the B2C growth.

**Business use case — bulk contributor payouts.** A company, DAO, or creator needs to pay 200 people small amounts across 40 countries. Today: collect bank details from everyone, eat PayPal fees and wire minimums, lose days, and fail entirely in half those countries. With Courier: paste handles and amounts, one command, everyone paid in seconds for cents — and recipients need nothing but a Telegram account. This is a real budget line that real organizations pay real money to solve today.

**Revenue model** (the Cash App shape — free P2P as growth, margin elsewhere):

| Line | Mechanism | Notes |
|---|---|---|
| Domestic P2P | Free | Growth engine, not revenue |
| Cross-border | ~1% FX spread | Corridors cost ~6% today; 1% is a 6× improvement and still a strong take rate |
| Business payouts | Per-payout or monthly tier | Displaces a cost center, not a nice-to-have |
| Instant cash-out | Flat/percentage fee | Proven behavior at Venmo and Cash App |
| Card interchange | ~1% on spend | Long-term margin; also removes the need to off-ramp at all |

**Market:** global remittances run roughly $800B+ annually at an average cost near 6%. Telegram has on the order of a billion monthly users, heavily concentrated in exactly the markets where banking is worst. Contributor and creator payouts are a fast-growing, cross-border, badly served category.

**Competition, honestly:** Venmo and Cash App are domestic and closed. Wise is excellent but account-based, not chat-native. Telegram's own wallet and TON are the sharpest competitor — our differentiation is delivery to people who have *nothing*, the group primitives that follow, and Solana's cost and finality. WhatsApp Pay has limited rollout and no bot platform.

## 5. Product

**Core flows**

- `/send @handle <amount>` — pay by handle; recipient wallet auto-created on first receive
- `/balance` — balance in dollars
- `/deposit` — deposit address plus Solana Pay QR
- `/withdraw <amount> <address>` — out to any wallet or exchange
- Sponsored gas on every transaction; users never need SOL
- Embedded per-user wallet keyed to Telegram identity, with key export

**Roadmap flows:** Apple Pay funding · `/split` in group chats · group pots with approvals · bulk payout for businesses · card that spends the balance directly

## 6. Scope

**In:** send by handle · wallet-on-receive · sponsored gas · deposit address + QR · withdraw to any address · treasury drop of $0.25 to each new member so the room is instantly funded · live counter of wallets created, transactions, and volume

**Out, explicitly:** fiat on-ramp and KYC · the card · split, pots, tandas · business bulk payout · account recovery

## 7. Demo (3 min, live)

1. QR on the projector — the room joins the group. Member count climbs on screen.
2. Bot drops $0.25 on each new member. Everyone has money before we've explained anything.
3. Hand a judge the phone: `/send @nicky 1`. Settles in under a second; bot posts the explorer link in-thread.
4. Find someone in the room who has never touched crypto. They receive. Wallet created. Nothing installed, no seed phrase, no gas.
5. **"Nobody in this room owns any SOL, and every transaction you just watched worked."**
6. Close on the counter: wallets created tonight, transactions, dollars moved.

## 8. Stack and partners

Solana + USDC for settlement. **QuickNode** for RPC and webhook confirmations posted back into chat — one transaction per message means real throughput. **OKX** as deposit and cash-out path and the graduate-to-self-custody destination. **Solana Pay** for the deposit QR. Embedded wallets for per-user keys. Built end to end in **Cursor**.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Custody / money transmission | User-held embedded keys, key export, every fiat leg through licensed partners — no customer funds on our books |
| Telegram rate limits under load | Batch confirmations; pinned live counter instead of a message per transaction |
| Sybil farming the welcome drop | One drop per account, rate-limited, capped total |
| Account loss = fund loss | Recovery path via passkey and export — first-30-day priority |
| Platform dependence on Telegram | Same graph model ports to WhatsApp Business API |

## 10. Self-described milestones

- **2 weeks** — mainnet-beta deploy, repository open-sourced, first 100 wallets created, weekly public update cadence started
- **30 days** — Apple Pay funding live, 500 users, account recovery shipped
- **60 days** — bulk payout command live, first paying business customer
- **90 days** — group primitives (split, pots), first cross-border corridor with FX pricing

## 11. Success metrics

**Tonight:** wallets created for people who had never used Solana, transactions settled, dollars moved.

**Ongoing:** share of users who were *created by receiving* rather than by signing up — the number that proves the flywheel.

## 12. Why this team

We shipped a working version in a single evening. The grant asks for projects that yield results quickly and are executable by the proposing team; the product is the evidence for both. We intend to open-source shortly after mainnet deploy.
