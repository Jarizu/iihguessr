import { SeventeenLandsCard, DraftFormat } from "@/types";
import { SEVENTEEN_LANDS_BASE_URL } from "@/lib/utils/constants";

/**
 * Fetch card ratings from 17lands for a specific set and format
 * Uses event_type, start_date, and end_date parameters for historical data access
 */
export async function fetchCardRatings(
  setCode: string,
  format: DraftFormat,
  startDate: string,
  endDate: string
): Promise<SeventeenLandsCard[]> {
  // 17lands API uses event_type instead of format, and requires date range
  const url = `${SEVENTEEN_LANDS_BASE_URL}/card_ratings/data?expansion=${setCode}&event_type=${format}&start_date=${startDate}&end_date=${endDate}`;

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
  return data as SeventeenLandsCard[];
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
