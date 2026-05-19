export type Metric = "IIH" | "GIH_WR" | "ALSA";

export const METRICS: Metric[] = ["IIH", "GIH_WR", "ALSA"];
export const DEFAULT_METRIC: Metric = "IIH";

export type MetricColumn = "iihPremier" | "gihWrPremier" | "alsaPremier";

export interface MetricConfig {
  label: string;
  longLabel: string;
  column: MetricColumn;
  higherIsBetter: boolean;
  minDiff: number;
  maxDiff: number;
  format: (value: number) => string;
  formatDiff: (value: number) => string;
}

const pp = (v: number) => `${(v * 100).toFixed(1)}pp`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const pick = (v: number) => v.toFixed(2);

export const METRIC_CONFIG: Record<Metric, MetricConfig> = {
  IIH: {
    label: "IIH",
    longLabel: "Improvement In Hand",
    column: "iihPremier",
    higherIsBetter: true,
    minDiff: 0.01,
    maxDiff: 0.05,
    format: pp,
    formatDiff: pp,
  },
  GIH_WR: {
    label: "GIH WR",
    longLabel: "Games In Hand Win Rate",
    column: "gihWrPremier",
    higherIsBetter: true,
    minDiff: 0.01,
    maxDiff: 0.04,
    format: pct,
    formatDiff: pp,
  },
  ALSA: {
    label: "ALSA",
    longLabel: "Average Last Seen At",
    column: "alsaPremier",
    higherIsBetter: false,
    minDiff: 0.5,
    maxDiff: 3.0,
    format: pick,
    formatDiff: pick,
  },
};

export function isMetric(value: unknown): value is Metric {
  return typeof value === "string" && (METRICS as string[]).includes(value);
}

export function parseMetric(value: unknown): Metric {
  return isMetric(value) ? value : DEFAULT_METRIC;
}

/**
 * Given the chosen metric and the two card values, return the id of the
 * card with the "better" value (the correct answer). Ties go to A.
 */
export function correctCardId<T extends string>(
  metric: Metric,
  cardAId: T,
  valueA: number,
  cardBId: T,
  valueB: number,
): T {
  const aWins = METRIC_CONFIG[metric].higherIsBetter
    ? valueA >= valueB
    : valueA <= valueB;
  return aWins ? cardAId : cardBId;
}

export function metricInstruction(metric: Metric): string {
  const cfg = METRIC_CONFIG[metric];
  const direction = cfg.higherIsBetter ? "higher" : "lower";
  return `Which card has the ${direction} ${cfg.label}?`;
}
