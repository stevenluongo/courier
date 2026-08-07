import catalog from "@/data/paysh-catalog.json";

export type Listing = {
  id: string;
  name: string;
  kind: "api" | "human" | "orchestrator";
  capability: string;
  priceUsd: number;
  source: "chargehand" | "pay.sh";
  category?: string;
  description?: string;
  wallet: string; // display only
  human?: { status: "online" | "offline"; location?: string; avatar?: string };
};

function fakeWallet(seed: string) {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let out = "";
  for (let i = 0; i < 44; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out += chars[h % chars.length];
  }
  return out;
}

// Seeded first-party sellers used by the demo run.
const seeded: Listing[] = [
  {
    id: "orchestrator",
    name: "Chargehand Orchestrator",
    kind: "orchestrator",
    capability: "general_contractor",
    priceUsd: 0,
    source: "chargehand",
    wallet: fakeWallet("orchestrator"),
  },
  {
    id: "exa-search",
    name: "Exa Search",
    kind: "api",
    capability: "web_search",
    priceUsd: 0.02,
    source: "pay.sh",
    category: "search",
    description: "Semantic web search, pay per query",
    wallet: fakeWallet("exa"),
  },
  {
    id: "visioncount",
    name: "VisionCount",
    kind: "api",
    capability: "vision",
    priceUsd: 0.4,
    source: "chargehand",
    category: "ai_ml",
    description: "Head-count and object detection from images",
    wallet: fakeWallet("visioncount"),
  },
  {
    id: "visionpro-expensive",
    name: "OmniVision Pro",
    kind: "api",
    capability: "vision",
    priceUsd: 3.2,
    source: "chargehand",
    category: "ai_ml",
    description: "Premium multi-model vision ensemble",
    wallet: fakeWallet("omnivision"),
  },
  {
    id: "human-marcus",
    name: process.env.NEXT_PUBLIC_WORKER_NAME || "Marcus R.",
    kind: "human",
    capability: "photo",
    priceUsd: 1.5,
    source: "chargehand",
    category: "human",
    description: "Registered worker · wallet connected · Wynwood, Miami",
    wallet: fakeWallet("marcus"),
    human: { status: "online", location: "Wynwood, Miami" },
  },
];

type PayshProvider = {
  fqn: string;
  title: string;
  category: string;
  description: string;
  min_price_usd: number;
  max_price_usd: number;
  endpoint_count: number;
};

// Federated supply: the live Pay.sh catalog (Solana Foundation + Google Cloud),
// bundled as a snapshot so the demo has zero network dependencies.
const federated: Listing[] = (catalog.providers as PayshProvider[]).map((p) => ({
  id: `paysh:${p.fqn}`,
  name: p.title,
  kind: "api" as const,
  capability: p.category,
  priceUsd: Math.max(p.min_price_usd, 0.001),
  source: "pay.sh" as const,
  category: p.category,
  description: p.description,
  wallet: fakeWallet(p.fqn),
}));

export function allListings(): Listing[] {
  return [...seeded, ...federated];
}

export function getListing(id: string): Listing | undefined {
  return allListings().find((l) => l.id === id);
}

export function cheapest(capability: string, maxUsd: number): Listing | undefined {
  return allListings()
    .filter((l) => l.capability === capability && l.priceUsd <= maxUsd && l.kind !== "orchestrator")
    .sort((a, b) => a.priceUsd - b.priceUsd)[0];
}

export function payshProviderCount(): number {
  return federated.length;
}
