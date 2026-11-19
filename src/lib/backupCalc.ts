/**
 * Inverter backup estimate for a 12 V lead-acid / lithium home battery.
 *
 * Ah needed = load (W) × hours ÷ (12 V × 0.75)
 * 0.75 combines inverter efficiency (~85%) and usable depth of discharge (~88%).
 * It's an estimate for guidance, not an engineering sizing.
 */
export const APPLIANCES = [
  { id: "led", label: "LED bulb", watts: 10 },
  { id: "tube", label: "Tube light", watts: 20 },
  { id: "fan", label: "Ceiling fan", watts: 75 },
  { id: "tv", label: "LED TV", watts: 60 },
  { id: "wifi", label: "Wi-Fi router", watts: 10 },
  { id: "laptop", label: "Laptop", watts: 60 },
  { id: "fridge", label: "Fridge", watts: 150 },
  { id: "desktop", label: "Desktop PC", watts: 200 },
] as const;

export type ApplianceId = (typeof APPLIANCES)[number]["id"];

/** Common single-battery sizes sold for home inverters. */
export const STANDARD_AH = [100, 120, 150, 160, 180, 200, 220] as const;

const VOLTS = 12;
const EFFICIENCY = 0.75;

export interface BackupEstimate {
  watts: number;
  requiredAh: number;
  /** Smallest standard size per battery that covers the need. */
  recommendedAh: number | null;
  /** 1 for a 12 V inverter, 2 when two batteries (24 V setup) are needed. */
  batteries: number;
  /** Suggested inverter rating (VA), load ÷ 0.8 power factor, rounded up to 100. */
  inverterVA: number;
}

export function estimateBackup(counts: Partial<Record<ApplianceId, number>>, hours: number): BackupEstimate {
  const watts = APPLIANCES.reduce((sum, a) => sum + a.watts * Math.max(0, counts[a.id] ?? 0), 0);
  const requiredAh = watts > 0 && hours > 0 ? Math.ceil((watts * hours) / (VOLTS * EFFICIENCY)) : 0;
  const inverterVA = watts > 0 ? Math.ceil(watts / 0.8 / 100) * 100 : 0;
  if (requiredAh === 0) return { watts, requiredAh, recommendedAh: null, batteries: 1, inverterVA };
  for (const batteries of [1, 2]) {
    // Two 12 V batteries in series double the voltage, so each needs half the Ah.
    const perBattery = Math.ceil(requiredAh / batteries);
    const fit = STANDARD_AH.find((ah) => ah >= perBattery);
    if (fit) return { watts, requiredAh, recommendedAh: fit, batteries, inverterVA };
  }
  return { watts, requiredAh, recommendedAh: null, batteries: 2, inverterVA };
}
