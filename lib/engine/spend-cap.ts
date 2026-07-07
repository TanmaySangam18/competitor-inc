// Gate 2, below the prompt: a hard outbound-spend ceiling enforced in the executor, independent of any
// agent proposal or owner approval. Pure (no server-only) so it's unit-testable. Default 0 ⇒ no real money
// can move — matching payments-off. Raise deliberately via HARD_SPEND_CAP_CENTS. Because this is server-side
// code, not a prompt instruction, no agent error, bug, or prompt injection can spend above it even in principle.

export function hardSpendCapCents(): number {
  const v = Number(process.env.HARD_SPEND_CAP_CENTS);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

export function overHardCap(amountCents: number): boolean {
  return Math.max(0, Math.round(amountCents)) > hardSpendCapCents();
}
