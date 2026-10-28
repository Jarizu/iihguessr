import { SeventeenLandsCard, DraftFormat } from "@/types";
import {
  MIN_PLAYABLE_CARDS,
  SEVENTEEN_LANDS_BASE_URL,
} from "@/lib/utils/constants";

/**
 * Fetch card ratings from 17lands for a specific set and format.
 *
 * Uses /api/card_data with time_period=ALL_TIME.
 *
 * The older /card_ratings/data endpoint silently ignores every filter it is
 * given - start_date and end_date included - and always answers with the
 * LAST_DAY window. Nothing errors; the response just describes a single day.
 * That made the current set report noisy IIH values (Campus Crier in FRA read
 * +0.46pp off one day's 1,615 games against -0.05pp across all 80,711), and
 * made every set no longer in Arena's rotation return zero playable cards.
 *
 * time_period is the real control. Valid values, from /data/filters:
 * ALL_TIME, ALL_EXCEPT_FIRST_WEEK, LAST_TWO_EVENTS, LATEST_EVENT,
 * LAST_TWO_WEEKS, LAST_WEEK, LAST_DAY, FIRST_WEEK.
 */
export async function fetchCardRatings(
  setCode: string,
  format: DraftFormat
): Promise<SeventeenLandsCard[]> {
  // 17lands API uses event_type instead of format.
  // `expansion` is case-sensitive: lowercase codes return an empty array.
  const url = `${SEVENTEEN_LANDS_BASE_URL}/api/card_data?expansion=${setCode.toUpperCase()}&event_type=${format}&time_period=ALL_TIME`;

  console.log(`Fetching from: ${url}`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "IIHGuessr/1.0",
    },
    next: {
      revalidate: 86400, // Cache for 24 hours
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch 17lands data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // /api/card_data wraps the rows in { copyright, notes, data }, where the
  // old endpoint returned a bare array. Accept either.
  const rows = Array.isArray(data) ? data : data?.data;
  return (Array.isArray(rows) ? rows : []) as SeventeenLandsCard[];
}

/**
 * Get the IWD (drawn_improvement_win_rate) for a card
 * Returns null if the card doesn't have enough data
 */
export function getIwd(card: SeventeenLandsCard): number | null {
  // Require at least 50 games for any meaningful data (lowered for historical sets)
  if (card.ever_drawn_game_count < 50) {
    return null;
  }
  return card.drawn_improvement_win_rate;
}

/**
 * Probe whether 17lands has playable data for a set: at least
 * MIN_PLAYABLE_CARDS cards with enough games for an IIH value. Used by the daily discovery job to decide
 * whether a candidate set is worth ingesting.
 */
export async function probeSetHasData(
  setCode: string,
): Promise<boolean> {
  try {
    const ratings = await fetchCardRatings(setCode, "PremierDraft");
    const playable = ratings.filter((c) => c.ever_drawn_game_count >= 50);
    return playable.length >= MIN_PLAYABLE_CARDS;
  } catch {
    return false;
  }
}

/**
 * Map 17lands color format to standard MTG color array
 * 17lands uses formats like "W", "UB", "WUBRG", ""
 */
export function parseSeventeenLandsColors(color: string): string[] {
  if (!color || color === "") return [];
  return color.split("");
}

/**
 * Map 17lands rarity to standard format
 */
export function normalizeRarity(rarity: string): string {
  const rarityMap: Record<string, string> = {
    common: "common",
    uncommon: "uncommon",
    rare: "rare",
    mythic: "mythic",
  };
  return rarityMap[rarity.toLowerCase()] || rarity.toLowerCase();
}
