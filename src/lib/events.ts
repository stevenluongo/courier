// Global event bus with ring-buffer replay. Survives hot reload via globalThis.

export type ChargehandEvent = {
  id: number;
  ts: number;
  type:
    | "run_started"
    | "log" // reasoning console line
    | "step" // { index, state: "active" | "done" }
    | "plan"
    | "hire" // seller hired -> graph edge pulse
    | "payment" // payment settled -> receipt line
    | "job_offer" // human worker notification
    | "approval_request" // deliverable held in escrow, buyer must approve
    | "job_done" // human submitted
    | "photo" // photo available at url
    | "answer" // final synthesis
    | "receipt"
    | "run_done";
  data: Record<string, unknown>;
};

type Bus = {
  seq: number;
  buffer: ChargehandEvent[];
  listeners: Set<(e: ChargehandEvent) => void>;
};

const g = globalThis as unknown as { __chBus?: Bus };
const bus: Bus = (g.__chBus ??= { seq: 0, buffer: [], listeners: new Set() });

export function emit(type: ChargehandEvent["type"], data: Record<string, unknown> = {}) {
  const e: ChargehandEvent = { id: ++bus.seq, ts: Date.now(), type, data };
  bus.buffer.push(e);
  if (bus.buffer.length > 500) bus.buffer.shift();
  for (const l of bus.listeners) {
    try {
      l(e);
    } catch {}
  }
  return e;
}

export function subscribe(onEvent: (e: ChargehandEvent) => void, replayFrom = 0) {
  for (const e of bus.buffer) if (e.id > replayFrom) onEvent(e);
  bus.listeners.add(onEvent);
  return () => bus.listeners.delete(onEvent);
}

export function resetRunEvents() {
  bus.buffer = [];
}
