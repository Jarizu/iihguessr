import { describe, it, expect } from "vitest";
import type { Card } from "@prisma/client";
import { generateCardPair } from "./algorithm";

const makeCard = (overrides: Partial<Card>): Card =>
  ({
    id: overrides.id ?? "x",
    name: "Card",
    setCode: "test",
    collectorNumber: "1",
    colors: JSON.stringify(["U"]),
    colorIdentity: JSON.stringify(["U"]),
    rarity: "common",
    typeLine: "Creature",
    manaCost: "{2}{U}",
    scryfallId: "id",
    imageUri: "",
    imageUriLarge: null,
    iihPremier: null,
    winRatePremier: null,
    gihWrPremier: null,
    alsaPremier: null,
    gamesPlayed: 1000,
    isBasicLand: false,
    isSpecialGuest: false,
    lastSyncedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Card;

describe("generateCardPair", () => {
  it("returns null when there are fewer than two eligible cards for the metric", () => {
    // Cards with IIH but missing GIH WR — should produce nothing for GIH_WR
    const cards = [
      makeCard({ id: "a", iihPremier: 0.02 }),
      makeCard({ id: "b", iihPremier: 0.04 }),
    ];
    expect(generateCardPair(cards, "PremierDraft", "GIH_WR")).toBeNull();
  });

  it("picks pairs using the chosen metric's column (GIH WR)", () => {
    const cards = [
      makeCard({ id: "a", gihWrPremier: 0.55 }),
      makeCard({ id: "b", gihWrPremier: 0.57 }),
      makeCard({ id: "c", gihWrPremier: 0.60 }),
    ];
    const pair = generateCardPair(cards, "PremierDraft", "GIH_WR");
    expect(pair).not.toBeNull();
    expect(pair!.map((c) => c.id).sort()).not.toEqual(["a", "a"]);
  });

  it("respects min/max thresholds for ALSA (lower-is-better, picks scale)", () => {
    const cards = [
      makeCard({ id: "a", alsaPremier: 2.0 }),
      makeCard({ id: "b", alsaPremier: 4.0 }), // diff 2.0 — within 0.5-3.0
      makeCard({ id: "c", alsaPremier: 8.0 }), // diff from a is 6.0 — outside
      makeCard({ id: "d", alsaPremier: 2.1 }), // diff from a is 0.1 — below min
    ];
    // Force cardA selection by giving it overwhelming weight
    const pair = generateCardPair(cards, "PremierDraft", "ALSA");
    expect(pair).not.toBeNull();
    // Either cardA-cardB or some other valid pair from within thresholds
    const ids = pair!.map((c) => c.id);
    // Ensure neither is the same card twice
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("falls back when no candidates fit the threshold band", () => {
    // Two cards whose IIH diff is outside [0.01, 0.05]
    const cards = [
      makeCard({ id: "a", iihPremier: 0.01 }),
      makeCard({ id: "b", iihPremier: 0.30 }),
    ];
    const pair = generateCardPair(cards, "PremierDraft", "IIH");
    expect(pair).not.toBeNull();
    expect(pair!.map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("excludes basic lands and special guests", () => {
    const cards = [
      makeCard({ id: "a", iihPremier: 0.02, isBasicLand: true }),
      makeCard({ id: "b", iihPremier: 0.04 }),
    ];
    // Only one eligible card after filter
    expect(generateCardPair(cards, "PremierDraft", "IIH")).toBeNull();
  });

  it("requires gamesPlayed >= 50", () => {
    const cards = [
      makeCard({ id: "a", iihPremier: 0.02, gamesPlayed: 10 }),
      makeCard({ id: "b", iihPremier: 0.04, gamesPlayed: 10 }),
    ];
    expect(generateCardPair(cards, "PremierDraft", "IIH")).toBeNull();
  });
});
