import { describe, it, expect } from "vitest";
import { estimateBackup } from "@/lib/backupCalc";

describe("estimateBackup", () => {
  it("returns nothing when no load or hours", () => {
    expect(estimateBackup({}, 4).recommendedAh).toBeNull();
    expect(estimateBackup({ fan: 2 }, 0).requiredAh).toBe(0);
  });

  it("2 fans + 4 LEDs + TV + wifi for 4h → 120Ah single battery", () => {
    // 150 + 40 + 60 + 10 = 260 W; 260 × 4 / 9 = 115.6 → 116 Ah → 120Ah
    const r = estimateBackup({ fan: 2, led: 4, tv: 1, wifi: 1 }, 4);
    expect(r.watts).toBe(260);
    expect(r.requiredAh).toBe(116);
    expect(r.recommendedAh).toBe(120);
    expect(r.batteries).toBe(1);
    expect(r.inverterVA).toBe(400);
  });

  it("splits into two batteries when one is not enough", () => {
    // 3 fans + fridge = 375 W × 8h / 9 = 333.3 → 334 Ah → 2 × 180Ah
    const r = estimateBackup({ fan: 3, fridge: 1 }, 8);
    expect(r.requiredAh).toBe(334);
    expect(r).toMatchObject({ batteries: 2, recommendedAh: 180 });
  });

  it("returns null when even two batteries are too small", () => {
    expect(estimateBackup({ desktop: 4 }, 8).recommendedAh).toBeNull();
  });
});
