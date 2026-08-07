import { NextRequest, NextResponse } from "next/server";
import { submitPhoto } from "@/lib/run";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { dataUrl } = await req.json();
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "dataUrl (image) required" }, { status: 400 });
  }
  const ok = submitPhoto(dataUrl);
  return NextResponse.json({ ok });
}
