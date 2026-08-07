import { NextRequest, NextResponse } from "next/server";
import { startRun, currentRun } from "@/lib/run";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { task, budgetUsd } = await req.json();
  if (!task || typeof task !== "string") {
    return NextResponse.json({ error: "task required" }, { status: 400 });
  }
  const id = await startRun(task, Number(budgetUsd) || 5);
  return NextResponse.json({ id });
}

export async function GET() {
  const run = currentRun();
  return NextResponse.json(
    run
      ? { id: run.id, task: run.task, status: run.status, spentUsd: run.spentUsd, budgetUsd: run.budgetUsd, pendingJob: run.pendingJob ?? null }
      : { status: "idle" }
  );
}
