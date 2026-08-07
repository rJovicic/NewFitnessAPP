// PDF Chapter 13 adjustment rules. Thresholds/windows called out inline are
// this implementation's own reasonable defaults where the PDF gives a rule
// but not an exact day-count — same pattern as the fasting grace period.

export type AdjustmentType = "plateau" | "fast_loss" | "low_energy" | "rising_effort";

export interface AdjustmentSuggestion {
  type: AdjustmentType;
  title: string;
  message: string;
  suggestedDeltaKcal: number;
}

export interface WeightRollingPoint {
  date: string;
  rollingAvgKg: number;
}

export interface EnergyPoint {
  date: string;
  energyLevel: number;
}

export interface EffortPoint {
  date: string;
  perceivedEffort: number;
}

const LOW_ENERGY_THRESHOLD = 4; // out of 10
const LOW_ENERGY_CONSECUTIVE_DAYS = 3;
const TREND_WINDOW_DAYS = 14;

/** No weight loss (rolling average flat or up) over the last 2+ weeks. */
export function detectPlateau(points: WeightRollingPoint[]): AdjustmentSuggestion | null {
  if (points.length === 0) return null;
  const last = points[points.length - 1];
  const lastTime = new Date(`${last.date}T00:00:00Z`).getTime();
  const windowStart = points.find(
    (p) =>
      (lastTime - new Date(`${p.date}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000) >=
      TREND_WINDOW_DAYS
  );
  if (!windowStart) return null; // not enough history yet

  const change = last.rollingAvgKg - windowStart.rollingAvgKg;
  if (change >= 0) {
    return {
      type: "plateau",
      title: "Weight has plateaued",
      message:
        "Your rolling average hasn't dropped over the last 2 weeks. Consider tightening the deficit.",
      suggestedDeltaKcal: -175,
    };
  }
  return null;
}

/** Losing weight faster than 0.6 kg/week (rolling average). */
export function detectFastLoss(points: WeightRollingPoint[]): AdjustmentSuggestion | null {
  if (points.length === 0) return null;
  const last = points[points.length - 1];
  const lastTime = new Date(`${last.date}T00:00:00Z`).getTime();
  const windowStart = points.find(
    (p) => (lastTime - new Date(`${p.date}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000) >= 7
  );
  if (!windowStart) return null;

  const days =
    (lastTime - new Date(`${windowStart.date}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000);
  const weeklyRate = ((windowStart.rollingAvgKg - last.rollingAvgKg) / days) * 7;

  if (weeklyRate > 0.6) {
    return {
      type: "fast_loss",
      title: "Losing weight faster than planned",
      message: `Your rolling average is dropping about ${weeklyRate.toFixed(
        1
      )} kg/week — faster than the recomposition target. Consider easing the deficit.`,
      suggestedDeltaKcal: 150,
    };
  }
  return null;
}

/** Energy level logged low for several consecutive recent days. */
export function detectLowEnergy(points: EnergyPoint[]): AdjustmentSuggestion | null {
  if (points.length < LOW_ENERGY_CONSECUTIVE_DAYS) return null;
  const recent = points.slice(-LOW_ENERGY_CONSECUTIVE_DAYS);
  const allLow = recent.every((p) => p.energyLevel <= LOW_ENERGY_THRESHOLD);
  if (allLow) {
    return {
      type: "low_energy",
      title: "Energy has been low",
      message: `Energy has been at ${LOW_ENERGY_THRESHOLD}/10 or below for ${LOW_ENERGY_CONSECUTIVE_DAYS} days straight. Consider adding back some protein calories.`,
      suggestedDeltaKcal: 125,
    };
  }
  return null;
}

/** Perceived workout effort trending up over 2+ weeks (workload feeling harder). */
export function detectRisingEffort(points: EffortPoint[]): AdjustmentSuggestion | null {
  if (points.length < 4) return null;
  const half = Math.floor(points.length / 2);
  const firstHalf = points.slice(0, half);
  const secondHalf = points.slice(half);
  const avg = (arr: EffortPoint[]) =>
    arr.reduce((sum, p) => sum + p.perceivedEffort, 0) / arr.length;

  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);

  if (secondAvg - firstAvg >= 1) {
    return {
      type: "rising_effort",
      title: "Workouts feeling harder",
      message:
        "Perceived effort has been trending up. Consider a pre-workout carb bump or a deload week.",
      suggestedDeltaKcal: 100,
    };
  }
  return null;
}

export function computeAdjustmentSuggestions(input: {
  weightRolling: WeightRollingPoint[];
  energyHistory: EnergyPoint[];
  effortHistory: EffortPoint[];
}): AdjustmentSuggestion[] {
  return [
    detectFastLoss(input.weightRolling),
    detectPlateau(input.weightRolling),
    detectLowEnergy(input.energyHistory),
    detectRisingEffort(input.effortHistory),
  ].filter((s): s is AdjustmentSuggestion => s !== null);
}
