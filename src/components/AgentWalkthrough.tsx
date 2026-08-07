"use client";

import { useEffect, useRef } from "react";

export type StepState = "pending" | "active" | "done";
export type Hire = { name: string; amountUsd?: number; kind: string; source?: string; note?: string; sig?: string };
export type Step = {
  title: string;
  state: StepState;
  hires: Hire[];
  thoughts: string[]; // reasoning lines attached to this step
};

export default function AgentWalkthrough({
  task,
  steps,
  preThoughts,
  photoUrl,
  needsApproval,
  onApprove,
  answer,
  running,
}: {
  task: string | null;
  steps: Step[];
  preThoughts: string[];
  photoUrl: string | null;
  needsApproval: boolean;
  onApprove: () => void;
  answer: string | null;
  running: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [steps, photoUrl, answer, needsApproval, preThoughts]);

  if (!task) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🤝</div>
          <div className="text-lg text-zinc-400 font-semibold">Give the agent a task and a budget.</div>
          <div className="mt-2 text-sm">
            It will plan the job, shop 70+ listings federated from Pay.sh, and hire whoever&apos;s best — API, agent, or human.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-8 py-6">
      {/* The task */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Task</div>
        <div className="text-2xl font-bold text-zinc-100">{task}</div>
      </div>

      {/* Pre-plan thinking */}
      {preThoughts.length > 0 && steps.length === 0 && (
        <div className="text-sm text-zinc-500 font-mono space-y-1">
          {preThoughts.map((t, i) => (
            <div key={i}>{t}</div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 transition-all duration-500 ${
              s.state === "active"
                ? "border-amber-400/60 bg-amber-400/5 shadow-lg shadow-amber-500/5"
                : s.state === "done"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-zinc-900 opacity-40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  s.state === "done"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : s.state === "active"
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-zinc-900 text-zinc-600"
                }`}
              >
                {s.state === "done" ? "✓" : i + 1}
              </div>
              <div className={`font-semibold ${s.state === "active" ? "text-amber-100" : s.state === "done" ? "text-zinc-300" : "text-zinc-600"}`}>
                {s.title}
              </div>
              {s.state === "active" && <span className="ml-auto text-amber-300 text-xs animate-pulse">working…</span>}
            </div>

            {/* Reasoning lines */}
            {s.thoughts.length > 0 && s.state !== "pending" && (
              <div className="mt-3 ml-10 space-y-1 font-mono text-[13px]">
                {s.thoughts.map((t, j) => (
                  <div
                    key={j}
                    className={
                      /REFUSED|CONCLUSION|escrow|none can observe/i.test(t)
                        ? "text-amber-300 font-semibold"
                        : /APPROVED|paid|HIRED|released|✓/i.test(t)
                        ? "text-emerald-300"
                        : "text-zinc-400"
                    }
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}

            {/* Hire cards */}
            {s.hires.length > 0 && (
              <div className="mt-3 ml-10 flex flex-wrap gap-2">
                {s.hires.map((h, j) => (
                  <div
                    key={j}
                    className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
                      h.kind === "human" ? "border-emerald-500/50 bg-emerald-950/30" : "border-indigo-500/40 bg-indigo-950/20"
                    }`}
                  >
                    <span className={h.kind === "human" ? "text-emerald-300 font-semibold" : "text-indigo-300 font-semibold"}>
                      {h.kind === "human" ? "🧑 " : "⚙ "}
                      {h.name}
                    </span>
                    {h.source === "pay.sh" && (
                      <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 text-[10px] font-bold">Pay.sh</span>
                    )}
                    {h.amountUsd !== undefined && (
                      <span className="text-zinc-300 font-mono">
                        ${h.amountUsd.toFixed(2)} <span className="text-emerald-400">✓ paid</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Photo + approval inline in its step */}
            {photoUrl && i === 2 && (
              <div className="mt-3 ml-10 flex items-start gap-4">
                <div
                  className={`w-64 rounded-xl overflow-hidden border-2 ${
                    needsApproval ? "border-amber-400" : "border-emerald-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="delivered by human worker" className="w-full" />
                </div>
                {needsApproval && (
                  <div className="rounded-xl border border-amber-400/50 bg-amber-950/20 p-4 max-w-xs">
                    <div className="text-amber-300 text-sm font-semibold">⏳ Held in escrow</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      The worker delivered. Payment releases only when the buyer approves the work.
                    </div>
                    <button
                      onClick={onApprove}
                      className="mt-3 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 text-sm"
                    >
                      ✓ Approve — release payment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Answer hero */}
      {answer && (
        <div className="mt-6 rounded-2xl bg-amber-400 text-zinc-950 p-6 shadow-2xl shadow-amber-500/20">
          <div className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">Answer</div>
          <div className="text-2xl font-black leading-snug">{answer}</div>
        </div>
      )}

      {running && !answer && <div className="mt-4 text-zinc-600 font-mono animate-pulse">▋</div>}
      <div className="h-6" />
    </div>
  );
}
