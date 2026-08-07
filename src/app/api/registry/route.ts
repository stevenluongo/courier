import { NextResponse } from "next/server";
import { allListings, payshProviderCount } from "@/lib/registry";

export async function GET() {
  return NextResponse.json({ listings: allListings(), payshProviders: payshProviderCount() });
}
