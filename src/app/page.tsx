"use client";

import { useEffect, useRef, useState } from "react";
import MarketGraph, { GraphListing } from "@/components/MarketGraph";

type LogLine = { text: string; cls: string; ts: number };
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
  const [listings, setListings] = useState<GraphListing[]>([]);
  const [payshCount, setPayshCount] = useState(0);
  const [task, setTask] = useState(DEFAULT_TASK);
  const [budget, setBudget] = useState(5);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [activeEdges, setActiveEdges] = useState<{ to: string; human: boolean }[]>([]);
  const [spent, setSpent] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/registry")
      .then((r) => r.json())
      .then((d) => {
        setListings(d.listings);
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
            setLogs([]);
            setPayments([]);
            setActiveEdges([]);
            setSpent(0);
            setPhotoUrl(null);
            setAnswer(null);
            setReceipt(null);
            break;
          case "log":
            setLogs((l) => [...l, { text: d.text, cls: d.cls, ts: e.ts }]);
            break;
          case "hire":
            setActiveEdges((edges) =>
              edges.some((x) => x.to === d.to) ? edges : [...edges, { to: d.to, human: d.listing?.kind === "human" }]
            );
            break;
          case "payment":
            setPayments((p) => [...p, { name: d.name, amountUsd: d.amountUsd, sig: d.sig, kind: d.kind, note: d.note }]);
            setSpent(d.spentUsd);
            break;
          case "photo":
            setPhotoUrl(`${d.url}?t=${Date.now()}`);
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

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

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
            <b className="text-zinc-300">{listings.length}</b> listings
          </span>
          <span>
            <b className="text-indigo-400">{payshCount}</b> federated via Pay.sh
          </span>
          <span>
            <b className="text-emerald-400">{listings.filter((l) => l.kind === "human").length}</b> human worker online
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
        {/* Graph */}
        <div className="flex-[3] relative border-r border-zinc-900">
          {listings.length > 0 && <MarketGraph listings={listings} activeEdges={activeEdges} />}
          {photoUrl && (
            <div className="absolute bottom-4 left-4 w-72 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-2xl shadow-emerald-500/20 bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="delivered by human worker" className="w-full" />
              <div className="px-3 py-2 text-xs text-emerald-300 font-semibold">
                📸 Delivered by a human worker · paid in USDC
              </div>
            </div>
          )}
          {answer && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-xl rounded-xl bg-amber-400 text-zinc-950 font-bold px-6 py-4 text-center shadow-2xl">
              {answer}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="flex-[2] flex flex-col min-h-0">
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
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Reasoning console */}
          <div ref={consoleRef} className="flex-1 overflow-y-auto px-5 py-3 font-mono text-[13px] leading-relaxed space-y-1.5">
            {logs.length === 0 && <div className="text-zinc-600">Reasoning log — give the agent a task to begin.</div>}
            {logs.map((l, i) => (
              <div
                key={i}
                className={
                  l.cls === "money"
                    ? "text-emerald-300"
                    : l.cls === "alert"
                    ? "text-amber-300"
                    : l.cls === "think"
                    ? "text-zinc-500"
                    : "text-zinc-300"
                }
              >
                {l.text}
              </div>
            ))}
            {running && <div className="text-zinc-600 animate-pulse">▋</div>}
          </div>

          {/* Payments / receipt */}
          <div className="border-t border-zinc-900 px-5 py-3 max-h-64 overflow-y-auto">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Payments — Solana</div>
            {payments.length === 0 && <div className="text-xs text-zinc-700">No payments yet.</div>}
            <div className="space-y-1.5">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className={p.kind === "human" ? "text-emerald-300" : "text-zinc-300"}>
                    {p.name}
                    <span className="text-zinc-600"> · {p.note}</span>
                  </span>
                  <span className="font-mono text-zinc-400">
                    ${p.amountUsd.toFixed(2)} <span className="text-zinc-700">{p.sig.slice(0, 8)}…</span>
                  </span>
                </div>
              ))}
            </div>
            {receipt && (
              <div className="mt-3 rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-xs">
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
