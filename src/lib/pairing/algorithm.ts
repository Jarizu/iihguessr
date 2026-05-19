import { Card } from "@prisma/client";
import { DraftFormat, CardPair, CardDisplay } from "@/types";
import { PAIRING_CONFIG } from "@/lib/utils/constants";
import { hasColorOverlap, parseColors } from "@/lib/utils/colors";
import { Metric, METRIC_CONFIG } from "@/lib/metrics";

interface BasePairingConfig {
  colorAffinityWeight: number;
  excludeBasicLands: boolean;
  excludeSpecialGuests: boolean;
}

function getMetricValue(card: Card, metric: Metric): number | null {
  const col = METRIC_CONFIG[metric].column;
  return card[col] as number | null;
}

/**
 * Generate a pair of cards for comparison against the given metric.
 */
export function generateCardPair(
  cards: Card[],
  format: DraftFormat,
  metric: Metric,
  config: BasePairingConfig = PAIRING_CONFIG,
): [Card, Card] | null {
  const { minDiff, maxDiff } = METRIC_CONFIG[metric];

  const eligible = cards.filter((c) => {
    if (config.excludeBasicLands && c.isBasicLand) return false;
    if (config.excludeSpecialGuests && c.isSpecialGuest) return false;
    if (getMetricValue(c, metric) === null) return false;
    if (c.gamesPlayed < 50) return false;
    return true;
  });

  if (eligible.length < 2) return null;

  const cardA = weightedRandomSelect(eligible, (c) =>
    Math.log(c.gamesPlayed + 1),
  );
  const valueA = getMetricValue(cardA, metric)!;
  const colorsA = parseColors(cardA.colors);

  const candidates = eligible.filter((c) => {
    if (c.id === cardA.id) return false;
    const valueB = getMetricValue(c, metric);
    if (valueB === null) return false;
    const diff = Math.abs(valueA - valueB);
    return diff >= minDiff && diff <= maxDiff;
  });

  if (candidates.length === 0) {
    const fallbackCandidates = eligible.filter((c) => c.id !== cardA.id);
    if (fallbackCandidates.length === 0) return null;
    const cardB =
      fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
    return randomizeOrder(cardA, cardB);
  }

  const colorMatched = candidates.filter((c) =>
    hasColorOverlap(colorsA, parseColors(c.colors)),
  );

  const pool =
    Math.random() < config.colorAffinityWeight && colorMatched.length > 0
      ? colorMatched
      : candidates;

  const cardB = pool[Math.floor(Math.random() * pool.length)];
  return randomizeOrder(cardA, cardB);
}

/**
 * Generate multiple card pairs for the given metric.
 */
export function generateCardPairs(
  cards: Card[],
  format: DraftFormat,
  metric: Metric,
  count: number,
  config: BasePairingConfig = PAIRING_CONFIG,
): [Card, Card][] {
  const pairs: [Card, Card][] = [];
  const usedPairIds = new Set<string>();

  let attempts = 0;
  const maxAttempts = count * 10;

  while (pairs.length < count && attempts < maxAttempts) {
    attempts++;

    const pair = generateCardPair(cards, format, metric, config);
    if (!pair) continue;

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

export function pairToResponse(cardA: Card, cardB: Card): CardPair {
  return {
    id: `${cardA.id}-${cardB.id}`,
    cardA: cardToDisplay(cardA),
    cardB: cardToDisplay(cardB),
  };
}

function weightedRandomSelect<T>(
  items: T[],
  weightFn: (item: T) => number,
): T {
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

function randomizeOrder(cardA: Card, cardB: Card): [Card, Card] {
  return Math.random() < 0.5 ? [cardA, cardB] : [cardB, cardA];
}
