/**
 * Utility functions for generating 17lands.com and Scryfall URLs
 */

export function getScryfallCardUrl(scryfallId: string): string {
  return `https://scryfall.com/card/${scryfallId}`;
}

export function get17LandsSetUrl(setCode: string): string {
  return `https://www.17lands.com/card_data?expansion=${setCode}&format=PremierDraft&start_date=2014-01-01`;
}

export const SEVENTEEN_LANDS_HOME = "https://www.17lands.com/";
