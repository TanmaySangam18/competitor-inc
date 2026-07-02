import type { Company } from "./types";

// THE net-spend number shown to users (spent minus credited-back, cents-rounded). It was computed
// inline in two dashboard components and had already started life as two copies — this is the one
// definition both render from.
export const netSpend = (c: Company): number => Math.round((c.ledger.spent - (c.ledger.credited ?? 0)) * 100) / 100;
