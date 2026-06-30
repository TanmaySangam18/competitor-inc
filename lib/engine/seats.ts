// Founding-tier scarcity — a REAL cap, not a fabricated countdown. The "founding" price is limited to
// a fixed number of seats; "left" is the cap minus the seats actually claimed (a real number, 0 until
// billing is live). We never invent a smaller number to manufacture urgency — the honesty wedge applies
// to our own pricing too. Pure + testable; the claimed count is wired to real billing data when it lands.
export const FOUNDING_SEATS_CAP = 100;

export function seatsRemaining(claimed: number, cap: number = FOUNDING_SEATS_CAP): number {
  const c = Number.isFinite(claimed) && claimed > 0 ? Math.floor(claimed) : 0;
  return Math.max(0, cap - c);
}

export function seatsSoldOut(claimed: number, cap: number = FOUNDING_SEATS_CAP): boolean {
  return seatsRemaining(claimed, cap) === 0;
}
