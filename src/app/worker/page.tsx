"use client";

import { useEffect, useRef, useState } from "react";

type Job = { jobId: string; description: string; priceUsd: number; workerName: string };

const WORKER_NAME = process.env.NEXT_PUBLIC_WORKER_NAME || "Steven Luongo";
const START_BALANCE = 12.4;

export default function WorkerPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [phase, setPhase] = useState<"idle" | "offered" | "captured" | "submitted" | "paid">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [balance, setBalance] = useState(START_BALANCE);
  const [paidAmount, setPaidAmount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data);
        if (e.type === "job_offer") {
          setJob({ jobId: e.data.jobId, description: e.data.description, priceUsd: e.data.priceUsd, workerName: e.data.workerName });
          setPhase("offered");
          setPreview(null);
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
        }
        if (e.type === "job_done") {
          setPaidAmount(e.data.amountUsd);
          setBalance((b) => Math.round((b + e.data.amountUsd) * 100) / 100);
          setPhase("paid");
        }
        if (e.type === "run_started") {
          setJob(null);
          setPhase("idle");
          setPreview(null);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  async function onFile(f: File) {
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.readAsDataURL(f);
    });
    // Downscale for fast upload over venue wifi
    const img = new Image();
    await new Promise((res) => {
      img.onload = res;
      img.src = dataUrl;
    });
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const small = canvas.toDataURL("image/jpeg", 0.7);
    setPreview(small);
    localStorage.setItem("lastCapture", small);
    setPhase("captured");
  }

  async function submit(dataUrl: string) {
    setPhase("submitted");
    await fetch("/api/worker/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
  }

  const lastCapture = typeof window !== "undefined" ? localStorage.getItem("lastCapture") : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center px-5 py-8 font-sans">
      {/* Profile */}
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl font-bold text-emerald-300">
            {WORKER_NAME.split(" ").map((s) => s[0]).join("")}
          </div>
          <div>
            <div className="text-lg font-semibold">{WORKER_NAME}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" /> Wallet connected · Wynwood, Miami
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Balance</div>
          <div className={`text-4xl font-bold mt-1 transition-colors ${phase === "paid" ? "text-emerald-400" : ""}`}>
            ${balance.toFixed(2)} <span className="text-base font-medium text-zinc-500">USDC</span>
          </div>
          {phase === "paid" && (
            <div className="mt-2 text-emerald-400 font-semibold animate-bounce">+${paidAmount.toFixed(2)} received · Solana</div>
          )}
        </div>

        {/* Job states */}
        <div className="mt-5">
          {phase === "idle" && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
              Waiting for jobs…
              <div className="mt-2 text-xs">Agents can hire you any time. Keep this open.</div>
            </div>
          )}

          {phase === "offered" && job && (
            <div className="rounded-2xl bg-indigo-950/60 border border-indigo-500/50 p-5 animate-pulse-slow">
              <div className="text-xs uppercase tracking-widest text-indigo-300">New job · from an AI agent</div>
              <div className="mt-2 text-lg font-semibold">{job.description}</div>
              <div className="mt-1 text-emerald-400 font-bold text-xl">${job.priceUsd.toFixed(2)} USDC</div>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-4 w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-4 text-lg"
              >
                📸 Take the photo
              </button>
              {lastCapture && (
                <button onClick={() => submit(lastCapture)} className="mt-2 w-full rounded-xl border border-zinc-700 text-zinc-400 py-2 text-sm">
                  Use last capture
                </button>
              )}
            </div>
          )}

          {phase === "captured" && preview && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="capture" className="rounded-xl w-full" />
              <button
                onClick={() => submit(preview)}
                className="mt-3 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 text-lg"
              >
                Deliver &amp; get paid
              </button>
              <button onClick={() => fileRef.current?.click()} className="mt-2 w-full rounded-xl border border-zinc-700 text-zinc-400 py-2 text-sm">
                Retake
              </button>
            </div>
          )}

          {phase === "submitted" && (
            <div className="rounded-2xl border border-zinc-800 p-8 text-center text-zinc-400">Delivering to the agent…</div>
          )}

          {phase === "paid" && (
            <div className="rounded-2xl bg-emerald-950/50 border border-emerald-500/50 p-6 text-center">
              <div className="text-3xl">✅</div>
              <div className="mt-2 font-semibold text-emerald-300">Job complete — paid instantly</div>
              <div className="text-xs text-zinc-500 mt-1">Hired, worked, and settled by software in under a minute.</div>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <div className="mt-8 text-center text-xs text-zinc-600">
          Chargehand · the general contractor for AI agents
        </div>
      </div>
    </main>
  );
}
