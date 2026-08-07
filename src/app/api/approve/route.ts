import { NextResponse } from "next/server";
import { approveWork } from "@/lib/run";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ ok: approveWork() });
}
