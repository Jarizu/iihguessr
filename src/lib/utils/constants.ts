import { DraftFormat } from "@/types";

export const FORMATS: DraftFormat[] = ["PremierDraft"];

export const DEFAULT_SET = "ecl";
export const DEFAULT_FORMAT: DraftFormat = "PremierDraft";

/**
 * Metric-agnostic pairing knobs. Per-metric min/max diff thresholds live
 * in METRIC_CONFIG inside src/lib/metrics.ts.
 */
export const PAIRING_CONFIG = {
  colorAffinityWeight: 0.7,
  excludeBasicLands: true,
  excludeSpecialGuests: true,
};

export const PRELOAD_PAIR_COUNT = 3;

export const SEVENTEEN_LANDS_BASE_URL = "https://www.17lands.com";
export const SCRYFALL_BASE_URL = "https://api.scryfall.com";
