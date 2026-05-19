import { ScryfallSet, ScryfallSetsResponse } from "@/types";
import { SCRYFALL_BASE_URL } from "@/lib/utils/constants";

/**
 * Set types we treat as candidates for 17lands data.
 * - expansion: normal expansion sets
 * - core: core sets (M19, M20, etc.)
 * - draft_innovation: STX, OTJ-style draft-innovation sets
 * Bonus sheets like STA are usually "masterpiece" or "expansion" themselves with a parent_set_code.
 */
const ELIGIBLE_SET_TYPES = new Set([
  "expansion",
  "core",
  "draft_innovation",
  "masterpiece",
]);

/**
 * Fetch every set Scryfall knows about. Single GET, no pagination required —
 * /sets returns ~700 entries in one response.
 */
export async function fetchAllSets(
  fetchImpl: typeof fetch = fetch,
): Promise<ScryfallSet[]> {
  const url = `${SCRYFALL_BASE_URL}/sets`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "IIHGuessr/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Scryfall /sets error: ${response.status} ${response.statusText}`,
    );
  }

  const data: ScryfallSetsResponse = await response.json();
  return data.data;
}

/**
 * Filter raw Scryfall sets to ones we'd consider for 17lands ingestion:
 * - paper (not digital-only — Alchemy etc. don't have Premier Draft on Arena)
 * - one of our eligible types
 * - released between minDate and (today + 7d), so we surface upcoming sets
 *   shortly before release rather than after
 */
export function filterCandidateSets(
  sets: ScryfallSet[],
  minReleaseDate: Date,
  now: Date = new Date(),
): ScryfallSet[] {
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return sets.filter((s) => {
    if (s.digital) return false;
    if (!ELIGIBLE_SET_TYPES.has(s.set_type)) return false;
    if (!s.released_at) return false;
    const released = new Date(s.released_at);
    if (released < minReleaseDate) return false;
    if (released > horizon) return false;
    return true;
  });
}
