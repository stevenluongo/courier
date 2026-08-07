import { currentRun } from "@/lib/run";

export const dynamic = "force-dynamic";

export async function GET() {
  const run = currentRun();
  const dataUrl = run?.photoDataUrl;
  if (!dataUrl) return new Response("no photo", { status: 404 });
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
  return new Response(Buffer.from(b64, "base64"), {
    headers: { "Content-Type": mime, "Cache-Control": "no-store" },
  });
}
