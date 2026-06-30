import { describe, it, expect } from "vitest";
import { seatsRemaining, seatsSoldOut, FOUNDING_SEATS_CAP } from "./seats";

describe("seatsRemaining — a real cap, never a fabricated countdown", () => {
  it("shows the full cap when nothing is claimed yet (honest pre-launch)", () => {
    expect(seatsRemaining(0)).toBe(FOUNDING_SEATS_CAP);
  });
  it("subtracts real claimed seats", () => {
    expect(seatsRemaining(37, 100)).toBe(63);
  });
  it("never goes negative when oversold", () => {
    expect(seatsRemaining(120, 100)).toBe(0);
  });
  it("treats junk/negative claimed counts as zero claimed", () => {
    expect(seatsRemaining(-5, 100)).toBe(100);
    expect(seatsRemaining(NaN, 100)).toBe(100);
  });
  it("floors fractional claims", () => {
    expect(seatsRemaining(2.9, 100)).toBe(98);
  });
  it("seatsSoldOut flips only at zero remaining", () => {
    expect(seatsSoldOut(99, 100)).toBe(false);
    expect(seatsSoldOut(100, 100)).toBe(true);
    expect(seatsSoldOut(101, 100)).toBe(true);
  });
});
