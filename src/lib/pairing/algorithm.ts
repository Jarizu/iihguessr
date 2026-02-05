import { Card } from "@prisma/client";
import { DraftFormat, CardPair, CardDisplay } from "@/types";
import { PAIRING_CONFIG } from "@/lib/utils/constants";
import { hasColorOverlap, parseColors } from "@/lib/utils/colors";

interface PairingConfig {
  minIwdDifference: number;
  maxIwdDifference: number;
  colorAffinityWeight: number;
  excludeBasicLands: boolean;
  excludeSpecialGuests: boolean;
}

/**
 * Generate a pair of cards for comparison
 */
export function generateCardPair(
  cards: Card[],
  format: DraftFormat,
  config: PairingConfig = PAIRING_CONFIG
): [Card, Card] | null {
  // Filter out excluded cards
  const eligible = cards.filter((c) => {
    if (config.excludeBasicLands && c.isBasicLand) return false;
    if (config.excludeSpecialGuests && c.isSpecialGuest) return false;

    const iih = c.iihPremier;
    if (iih === null) return false;

    // Require minimum game count for reliability (lowered for historical sets)
    if (c.gamesPlayed < 50) return false;

    return true;
  });

  if (eligible.length < 2) {
    return null;
  }

  // Pick first card with weighting toward cards with more games (more reliable data)
  const cardA = weightedRandomSelect(eligible, (c) => Math.log(c.gamesPlayed + 1));

  const iihA = cardA.iihPremier!;
  const colorsA = parseColors(cardA.colors);

  // Find valid pair candidates
  const candidates = eligible.filter((c) => {
    if (c.id === cardA.id) return false;

    const iihB = c.iihPremier;
    if (iihB === null) return false;

    const diff = Math.abs(iihA - iihB);
    return diff >= config.minIwdDifference && diff <= config.maxIwdDifference;
  });

  if (candidates.length === 0) {
    // Fallback: relax the IWD constraints but still exclude same card
    const fallbackCandidates = eligible.filter((c) => c.id !== cardA.id);
    if (fallbackCandidates.length === 0) return null;

    const cardB = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
    return randomizeOrder(cardA, cardB);
  }

  // Apply color affinity bias
  const colorMatched = candidates.filter((c) => {
    const colorsB = parseColors(c.colors);
    return hasColorOverlap(colorsA, colorsB);
  });

  const pool =
    Math.random() < config.colorAffinityWeight && colorMatched.length > 0
      ? colorMatched
      : candidates;

  // Select card B
  const cardB = pool[Math.floor(Math.random() * pool.length)];

  // Randomize order so position doesn't hint at answer
  return randomizeOrder(cardA, cardB);
}

/**
 * Generate multiple card pairs
 */
export function generateCardPairs(
  cards: Card[],
  format: DraftFormat,
  count: number,
  config: PairingConfig = PAIRING_CONFIG
): [Card, Card][] {
  const pairs: [Card, Card][] = [];
  const usedPairIds = new Set<string>();

  let attempts = 0;
  const maxAttempts = count * 10;

  while (pairs.length < count && attempts < maxAttempts) {
    attempts++;

    const pair = generateCardPair(cards, format, config);
    if (!pair) continue;

    // Avoid duplicate pairs (in either order)
    const pairId1 = `${pair[0].id}-${pair[1].id}`;
    const pairId2 = `${pair[1].id}-${pair[0].id}`;

    if (usedPairIds.has(pairId1) || usedPairIds.has(pairId2)) {
      continue;
    }

    usedPairIds.add(pairId1);
    pairs.push(pair);
  }

  return pairs;
}

/**
 * Convert Card to CardDisplay (without IWD - that's hidden)
 */
export function cardToDisplay(card: Card): CardDisplay {
  return {
    id: card.id,
    name: card.name,
    imageUri: card.imageUri,
    imageUriLarge: card.imageUriLarge,
    setCode: card.setCode,
    colors: parseColors(card.colors),
    rarity: card.rarity,
    typeLine: card.typeLine,
    manaCost: card.manaCost,
  };
}

/**
 * Convert a pair of Cards to a CardPair with unique ID
 */
export function pairToResponse(cardA: Card, cardB: Card): CardPair {
  return {
    id: `${cardA.id}-${cardB.id}`,
    cardA: cardToDisplay(cardA),
    cardB: cardToDisplay(cardB),
  };
}

/**
 * Weighted random selection from an array
 */
function weightedRandomSelect<T>(items: T[], weightFn: (item: T) => number): T {
  const weights = items.map(weightFn);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}

/**
 * Randomize the order of two cards
 */
function randomizeOrder(cardA: Card, cardB: Card): [Card, Card] {
  return Math.random() < 0.5 ? [cardA, cardB] : [cardB, cardA];
}
