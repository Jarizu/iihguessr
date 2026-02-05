import { ScryfallCard, ScryfallSearchResponse } from "@/types";
import { SCRYFALL_BASE_URL } from "@/lib/utils/constants";

/**
 * Fetch all cards from a set via Scryfall search API
 * Handles pagination automatically
 */
export async function fetchSetCards(setCode: string): Promise<ScryfallCard[]> {
  const allCards: ScryfallCard[] = [];
  let url = `${SCRYFALL_BASE_URL}/cards/search?q=set:${setCode.toLowerCase()}+is:booster&unique=cards`;

  while (url) {
    // Respect Scryfall rate limit (50-100ms between requests)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "IIHGuessr/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No cards found for this set
        return [];
      }
      throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
    }

    const data: ScryfallSearchResponse = await response.json();
    allCards.push(...data.data);

    // Check for more pages
    url = data.has_more && data.next_page ? data.next_page : "";
  }

  return allCards;
}

/**
 * Get a single card by set and collector number
 */
export async function fetchCard(setCode: string, collectorNumber: string): Promise<ScryfallCard | null> {
  const url = `${SCRYFALL_BASE_URL}/cards/${setCode.toLowerCase()}/${collectorNumber}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "IIHGuessr/1.0",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the image URI for a card
 * Handles double-faced cards by using the front face
 */
export function getCardImageUri(card: ScryfallCard, size: "small" | "normal" | "large" = "normal"): string {
  // Check for direct image_uris first
  if (card.image_uris) {
    return card.image_uris[size];
  }

  // For double-faced cards, use the front face
  if (card.card_faces && card.card_faces.length > 0 && card.card_faces[0].image_uris) {
    return card.card_faces[0].image_uris[size];
  }

  // Fallback to a placeholder
  return `https://cards.scryfall.io/normal/front/0/0/00000000-0000-0000-0000-000000000000.jpg`;
}

/**
 * Check if a card is a basic land
 */
export function isBasicLand(card: ScryfallCard): boolean {
  return card.type_line.includes("Basic Land");
}

/**
 * Check if a card is from the Special Guest / bonus sheet
 * These usually have collector numbers outside the main set range
 */
export function isSpecialGuest(card: ScryfallCard): boolean {
  // Special guests often have 'spg' in set code or high collector numbers
  const collectorNum = parseInt(card.collector_number, 10);

  // Most main sets have < 300 cards, special guests are often 300+
  // This is a heuristic - may need adjustment per set
  if (collectorNum >= 300) {
    return true;
  }

  // Check for non-numeric collector numbers (variants, promos)
  if (isNaN(collectorNum)) {
    return true;
  }

  return false;
}

/**
 * Search for a card by name within a set
 */
export async function searchCardByName(name: string, setCode: string): Promise<ScryfallCard | null> {
  const url = `${SCRYFALL_BASE_URL}/cards/named?exact=${encodeURIComponent(name)}&set=${setCode.toLowerCase()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "IIHGuessr/1.0",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
