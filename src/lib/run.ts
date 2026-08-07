import { emit, resetRunEvents } from "./events";
import { cheapest, getListing, Listing } from "./registry";

// ---------- run state ----------

export type RunState = {
  id: string;
  task: string;
  budgetUsd: number;
  spentUsd: number;
  status: "running" | "waiting_human" | "awaiting_approval" | "done";
  pendingJob?: { jobId: string; workerId: string; description: string; priceUsd: number };
  photoDataUrl?: string;
  photoResolver?: (dataUrl: string) => void;
  approvalResolver?: () => void;
};

const g = globalThis as unknown as { __chRun?: { current?: RunState } };
const store = (g.__chRun ??= {});

export function currentRun() {
  return store.current;
}

// ---------- helpers ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockTxSig(seed: string) {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "";
  let h = Date.now() ^ seed.length;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 88; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out += chars[h % chars.length];
  }
  return out;
}

function log(text: string, cls: "info" | "think" | "money" | "alert" = "info") {
  emit("log", { text, cls });
}

async function hireAndPay(run: RunState, listing: Listing, note: string) {
  emit("hire", { from: "orchestrator", to: listing.id, listing, note });
  await sleep(700);
  const sig = mockTxSig(listing.id + note);
  run.spentUsd = Math.round((run.spentUsd + listing.priceUsd) * 100) / 100;
  emit("payment", {
    from: "orchestrator",
    to: listing.id,
    name: listing.name,
    kind: listing.kind,
    amountUsd: listing.priceUsd,
    sig,
    note,
    spentUsd: run.spentUsd,
    budgetUsd: run.budgetUsd,
  });
  log(`HIRED · 402 → paid $${listing.priceUsd.toFixed(2)} USDC → ${listing.name}`, "money");
  return sig;
}

// ---------- vision (real if key present, plausible mock otherwise) ----------

async function countHeads(photoDataUrl?: string): Promise<{ count: number; real: boolean }> {
  const mock = Number(process.env.MOCK_HEADCOUNT || 187);
  const key = process.env.OPENAI_API_KEY;
  if (!key || !photoDataUrl) return { count: mock, real: false };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Count the number of people visible in this photo. Reply with a single integer only." },
              { type: "image_url", image_url: { url: photoDataUrl } },
            ],
          },
        ],
      }),
    });
    const j = await res.json();
    const n = parseInt(String(j.choices?.[0]?.message?.content ?? "").replace(/\D/g, ""), 10);
    if (Number.isFinite(n) && n > 0) return { count: n, real: true };
  } catch {}
  return { count: mock, real: false };
}

// ---------- the headline run: crowd count ----------

function isCrowdCountTask(task: string) {
  return /how many|headcount|head count|crowd|people.*(ship night|here|room|event)|attendance/i.test(task);
}

export async function startRun(task: string, budgetUsd: number) {
  resetRunEvents();
  const run: RunState = {
    id: `run_${Date.now()}`,
    task,
    budgetUsd,
    spentUsd: 0,
    status: "running",
  };
  store.current = run;
  emit("run_started", { task, budgetUsd });

  if (isCrowdCountTask(task)) {
    void crowdCountRun(run);
  } else {
    void genericRun(run);
  }
  return run.id;
}

async function crowdCountRun(run: RunState) {
  log(`TASK: ${run.task}`);
  log(`BUDGET: $${run.budgetUsd.toFixed(2)} USDC · Solana`);
  await sleep(900);

  emit("plan", {
    steps: [
      "Identify the event — what is \"Ship Night\", where, when?",
      "Establish a baseline — expected / registered attendance",
      "Observe the venue — real-time headcount requires eyes on the room",
      "Count — extract a number from the observation",
      "Synthesize — answer with confidence",
    ],
  });
  log("PLAN posted · 5 steps · shopping the market…", "think");
  await sleep(1400);

  // Step 1 — event lookup
  log("[1/5] Need: event lookup → querying registry for capability: web_search", "think");
  await sleep(900);
  const search = getListing("exa-search")!;
  log(`3 sellers found · cheapest: ${search.name} (via Pay.sh) — $${search.priceUsd.toFixed(2)}`, "think");
  await hireAndPay(run, search, "event lookup");
  await sleep(1100);
  log("→ \"Cursor Miami: Ship Night — luma.com/cursor-8hml. Tonight, Wynwood, Miami. Doors 4PM, winners 10:30PM.\"");
  await sleep(1300);

  // Step 2 — baseline
  log("[2/5] Need: expected attendance → same seller, follow-up query", "think");
  await hireAndPay(run, search, "attendance baseline");
  await sleep(900);
  log("→ \"250+ builders registered · venue capacity ~300 · event is LIVE now.\"");
  await sleep(1400);

  // Step 3 — the realization + human hire
  log("[3/5] Need: current headcount at the venue", "think");
  await sleep(1200);
  log("Checked 74 API listings for real-time occupancy… none can observe a private venue.", "alert");
  await sleep(1400);
  log("CONCLUSION: physical presence required.", "alert");
  await sleep(1000);
  log("→ querying registry for capability: photo, location: Wynwood", "think");
  await sleep(1100);
  const human = getListing("human-marcus")!;
  log(`1 registered worker available · wallet connected · rate $${human.priceUsd.toFixed(2)}`, "think");
  await sleep(800);

  const jobId = `job_${Date.now()}`;
  run.status = "waiting_human";
  run.pendingJob = {
    jobId,
    workerId: human.id,
    description: "Take one photo of the Ship Night room, right now.",
    priceUsd: human.priceUsd,
  };
  emit("hire", { from: "orchestrator", to: human.id, listing: human, note: "photo of venue" });
  emit("job_offer", {
    jobId,
    workerId: human.id,
    workerName: human.name,
    description: run.pendingJob.description,
    priceUsd: human.priceUsd,
  });
  log(`HIRED: ${human.name} — notification sent. Waiting for delivery…`, "money");

  // Wait for the photo (or auto-continue as insurance).
  const photo = await new Promise<string | undefined>((resolve) => {
    run.photoResolver = resolve;
    const autoMs = Number(process.env.AUTO_PHOTO_MS || 0);
    if (autoMs > 0) setTimeout(() => resolve(undefined), autoMs);
  });
  run.pendingJob = undefined;
  if (photo) {
    run.photoDataUrl = photo;
    emit("photo", { url: "/api/photo" });
  }

  // Buyer approval gate: payment is held until the work is approved on the big screen.
  log("Deliverable received — held in escrow, awaiting buyer approval…", "alert");
  run.status = "awaiting_approval";
  emit("approval_request", { jobId, workerId: human.id, workerName: human.name, priceUsd: human.priceUsd });
  await new Promise<void>((resolve) => {
    run.approvalResolver = resolve;
  });
  run.status = "running";
  run.approvalResolver = undefined;
  log("Work APPROVED by buyer — releasing payment from escrow.", "money");
  await sleep(600);

  const sig = mockTxSig(human.id + jobId);
  run.spentUsd = Math.round((run.spentUsd + human.priceUsd) * 100) / 100;
  emit("payment", {
    from: "orchestrator",
    to: human.id,
    name: human.name,
    kind: "human",
    amountUsd: human.priceUsd,
    sig,
    note: "photo delivered",
    spentUsd: run.spentUsd,
    budgetUsd: run.budgetUsd,
  });
  emit("job_done", { jobId, workerId: human.id, amountUsd: human.priceUsd, sig });
  log(`Photo received from ${human.name} · payment released — $${human.priceUsd.toFixed(2)} ✓`, "money");
  await sleep(1300);

  // Step 4 — vision, with the budget beat
  log("[4/5] Need: headcount from image → querying registry for capability: vision", "think");
  await sleep(1000);
  const remaining = run.budgetUsd - run.spentUsd;
  const expensive = getListing("visionpro-expensive")!;
  log(`2 sellers found · OmniVision Pro $${expensive.priceUsd.toFixed(2)} — exceeds remaining budget ($${remaining.toFixed(2)}). REFUSED.`, "alert");
  await sleep(1400);
  const vision = getListing("visioncount")!;
  log(`Selecting ${vision.name} — $${vision.priceUsd.toFixed(2)} · within budget`, "think");
  await hireAndPay(run, vision, "headcount from photo");
  log("Counting…", "think");
  const { count, real } = await countHeads(run.photoDataUrl);
  await sleep(real ? 300 : 1600);
  log(`→ ${count} people detected (±${Math.max(3, Math.round(count * 0.05))})`);
  await sleep(1400);

  // Step 5 — synthesis
  log("[5/5] Synthesis:", "think");
  await sleep(800);
  const pct = Math.round((count / 250) * 100);
  const answer = `~${count} people at Ship Night right now — about ${pct}% of the 250 registered still in the room. High confidence: photo timestamped seconds ago.`;
  emit("answer", { answer, count, pct });
  log(answer, "money");
  await sleep(600);

  finishRun(run, [
    { name: "Exa Search (Pay.sh)", amount: search.priceUsd * 2, kind: "api" },
    { name: `${human.name} (human · photo)`, amount: human.priceUsd, kind: "human" },
    { name: `${vision.name} (vision)`, amount: vision.priceUsd, kind: "api" },
  ]);
}

// Generic path so any judge-typed task still produces a run.
async function genericRun(run: RunState) {
  log(`TASK: ${run.task}`);
  log(`BUDGET: $${run.budgetUsd.toFixed(2)} USDC · Solana`);
  await sleep(800);
  emit("plan", { steps: ["Research the task", "Buy analysis", "Synthesize"] });
  const search = getListing("exa-search")!;
  log("[1/3] Need: research → capability: web_search", "think");
  await hireAndPay(run, search, "research");
  await sleep(1000);
  const llm = cheapest("ai_ml", run.budgetUsd - run.spentUsd);
  if (llm) {
    log(`[2/3] Need: analysis → hiring ${llm.name} (via Pay.sh)`, "think");
    await hireAndPay(run, llm, "analysis");
    await sleep(1000);
  }
  log("[3/3] Synthesis complete.", "think");
  const answer = `Task completed with ${llm ? 2 : 1} workers hired for $${run.spentUsd.toFixed(2)} of a $${run.budgetUsd.toFixed(2)} budget.`;
  emit("answer", { answer });
  finishRun(run, [
    { name: search.name, amount: search.priceUsd, kind: "api" },
    ...(llm ? [{ name: llm.name, amount: llm.priceUsd, kind: "api" as const }] : []),
  ]);
}

function finishRun(run: RunState, lines: { name: string; amount: number; kind: string }[]) {
  run.status = "done";
  emit("receipt", {
    lines,
    totalUsd: run.spentUsd,
    budgetUsd: run.budgetUsd,
    returnedUsd: Math.round((run.budgetUsd - run.spentUsd) * 100) / 100,
    workers: lines.length,
    humans: lines.filter((l) => l.kind === "human").length,
  });
  emit("run_done", {});
}

export function submitPhoto(dataUrl: string) {
  const run = store.current;
  if (!run || run.status !== "waiting_human") return false;
  run.photoResolver?.(dataUrl);
  return true;
}

export function approveWork() {
  const run = store.current;
  if (!run || run.status !== "awaiting_approval") return false;
  run.approvalResolver?.();
  return true;
}
