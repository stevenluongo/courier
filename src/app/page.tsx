"use client";

import { useEffect, useRef, useState } from "react";
import AgentWalkthrough, { Step } from "@/components/AgentWalkthrough";

type PaymentLine = { name: string; amountUsd: number; sig: string; kind: string; note: string };
type Receipt = {
  lines: { name: string; amount: number; kind: string }[];
  totalUsd: number;
  budgetUsd: number;
  returnedUsd: number;
  workers: number;
  humans: number;
};

const DEFAULT_TASK = "How many people are at Ship Night right now?";

export default function Stage() {
  const [listingCount, setListingCount] = useState(0);
  const [payshCount, setPayshCount] = useState(0);
  const [task, setTask] = useState(DEFAULT_TASK);
  const [budget, setBudget] = useState(5);
  const [running, setRunning] = useState(false);
  const [runTask, setRunTask] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [preThoughts, setPreThoughts] = useState<string[]>([]);
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [spent, setSpent] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const activeStep = useRef(-1);

  useEffect(() => {
    fetch("/api/registry")
      .then((r) => r.json())
      .then((d) => {
        setListingCount(d.listings.length);
        setPayshCount(d.payshProviders);
      });
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data);
        const d = e.data;
        switch (e.type) {
          case "run_started":
            setRunning(true);
            setRunTask(d.task);
            setSteps([]);
            setPreThoughts([]);
            setPayments([]);
            setSpent(0);
            setPhotoUrl(null);
            setNeedsApproval(false);
            setAnswer(null);
            setReceipt(null);
            activeStep.current = -1;
            break;
          case "plan":
            setSteps((d.steps as string[]).map((title) => ({ title, state: "pending", hires: [], thoughts: [] })));
            break;
          case "step":
            activeStep.current = d.state === "active" ? d.index : activeStep.current;
            setSteps((prev) => prev.map((s, i) => (i === d.index ? { ...s, state: d.state } : s)));
            break;
          case "log": {
            const text = d.text as string;
            const idx = activeStep.current;
            if (idx < 0) {
              setPreThoughts((p) => [...p, text]);
            } else {
              setSteps((prev) =>
                prev.map((s, i) => (i === idx ? { ...s, thoughts: [...s.thoughts, text.replace(/^\[\d+\/\d+\]\s*/, "")] } : s))
              );
            }
            break;
          }
          case "hire": {
            const idx = Math.max(0, activeStep.current);
            const hire = {
              name: d.listing?.name ?? d.to,
              kind: d.listing?.kind ?? "api",
              source: d.listing?.source,
              note: d.note,
            };
            setSteps((prev) =>
              prev.map((s, i) =>
                i === idx && !s.hires.some((h) => h.name === hire.name && h.note === hire.note)
                  ? { ...s, hires: [...s.hires, hire] }
                  : s
              )
            );
            break;
          }
          case "payment": {
            setPayments((p) => [...p, { name: d.name, amountUsd: d.amountUsd, sig: d.sig, kind: d.kind, note: d.note }]);
            setSpent(d.spentUsd);
            setSteps((prev) =>
              prev.map((s) => ({
                ...s,
                hires: s.hires.map((h) =>
                  h.name === d.name && h.amountUsd === undefined ? { ...h, amountUsd: d.amountUsd, sig: d.sig } : h
                ),
              }))
            );
            break;
          }
          case "photo":
            setPhotoUrl(`${d.url}?t=${Date.now()}`);
            break;
          case "approval_request":
            setNeedsApproval(true);
            break;
          case "job_done":
            setNeedsApproval(false);
            break;
          case "answer":
            setAnswer(d.answer);
            break;
          case "receipt":
            setReceipt(d as Receipt);
            break;
          case "run_done":
            setRunning(false);
            break;
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  async function start() {
    await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, budgetUsd: budget }),
    });
  }

  const pct = Math.min(100, (spent / budget) * 100);

  return (
    <main className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-900">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-black tracking-tight text-amber-300">CHARGEHAND</h1>
          <span className="text-sm text-zinc-500">the general contractor for AI agents</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>
            <b className="text-zinc-300">{listingCount}</b> listings
          </span>
          <span>
            <b className="text-indigo-400">{payshCount}</b> federated via Pay.sh
          </span>
          <span>
            <b className="text-emerald-400">1</b> human worker online
          </span>
          <span className="text-zinc-600">USDC · Solana</span>
        </div>
      </header>

      {/* Task bar */}
      <div className="flex gap-2 px-6 py-3 border-b border-zinc-900 items-center">
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
          placeholder="Give the agent a task…"
        />
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm">
          <span className="text-zinc-500">$</span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-12 bg-transparent outline-none"
          />
          <span className="text-zinc-600 text-xs">budget</span>
        </div>
        <button
          onClick={start}
          disabled={running}
          className="rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-950 font-bold px-6 py-2.5 text-sm"
        >
          {running ? "Hiring…" : "Run"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Agent walkthrough */}
        <div className="flex-[3] min-h-0 border-r border-zinc-900">
          <AgentWalkthrough
            task={runTask}
            steps={steps}
            preThoughts={preThoughts}
            photoUrl={photoUrl}
            needsApproval={needsApproval}
            onApprove={() => fetch("/api/approve", { method: "POST" })}
            answer={answer}
            running={running}
          />
        </div>

        {/* Right rail */}
        <div className="flex-[1.2] flex flex-col min-h-0">
          {/* Budget bar */}
          <div className="px-5 py-3 border-b border-zinc-900">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-500 uppercase tracking-widest">Budget — enforced in code</span>
              <span className="font-mono">
                <b className={spent > 0 ? "text-amber-300" : "text-zinc-400"}>${spent.toFixed(2)}</b>
                <span className="text-zinc-600"> / ${budget.toFixed(2)}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Payments */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Payments — Solana</div>
            {payments.length === 0 && <div className="text-xs text-zinc-700">No payments yet.</div>}
            <div className="space-y-2">
              {payments.map((p, i) => (
                <div key={i} className="rounded-lg bg-zinc-900/60 border border-zinc-800/80 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={p.kind === "human" ? "text-emerald-300 font-semibold" : "text-zinc-300"}>
                      {p.kind === "human" ? "🧑 " : ""}
                      {p.name}
                    </span>
                    <span className="font-mono text-amber-300 font-bold">${p.amountUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 text-[10px] text-zinc-600">
                    <span>{p.note}</span>
                    <span className="font-mono">{p.sig.slice(0, 12)}…</span>
                  </div>
                </div>
              ))}
            </div>

            {receipt && (
              <div className="mt-3 rounded-lg bg-zinc-900 border border-amber-400/30 p-3 text-xs">
                <div className="font-bold text-zinc-200">
                  RECEIPT — {receipt.workers} workers hired · {receipt.humans} human
                </div>
                <div className="mt-1 text-zinc-400">
                  Total <b className="text-amber-300">${receipt.totalUsd.toFixed(2)}</b> of ${receipt.budgetUsd.toFixed(2)} ·{" "}
                  <b className="text-emerald-400">${receipt.returnedUsd.toFixed(2)} returned</b>
                </div>
                <div className="mt-1 text-zinc-600">One budget, any worker — human or machine.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
