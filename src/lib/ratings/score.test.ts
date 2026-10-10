import { describe, expect, it } from "vitest";
import { computeSetScores, type RatingRow } from "./score";

const r = (
  userId: string,
  setCode: string,
  fun: number,
  experience = "lots",
  tags: string[] = [],
): RatingRow => ({ userId, setCode, fun, experience, tags });

describe("computeSetScores", () => {
  it("returns nothing for no ratings", () => {
    expect(computeSetScores([]).sets.size).toBe(0);
  });

  it("marks sets with fewer than 5 ratings as not ranked", () => {
    const rows = [1, 2, 3, 4].map((i) => r(`u${i}`, "aaa", 8));
    const s = computeSetScores(rows).sets.get("aaa")!;
    expect(s.count).toBe(4);
    expect(s.ranked).toBe(false);
  });

  it("keeps a few perfect scores from outranking a well-loved set", () => {
    const rows = [
      // 3 tens
      ...[1, 2, 3].map((i) => r(`a${i}`, "few", 10)),
      // 40 nines
      ...Array.from({ length: 40 }, (_, i) => r(`b${i}`, "many", 9)),
      // a block of 5s to set the site mean
      ...Array.from({ length: 40 }, (_, i) => r(`c${i}`, "meh", 5)),
    ];
    const { sets } = computeSetScores(rows);
    expect(sets.get("many")!.score).toBeGreaterThan(sets.get("few")!.score);
    expect(sets.get("few")!.rawMean).toBe(10);
  });

  it("corrects for raters who rate everything high", () => {
    // Generous raters rate everything 9-10; normal raters use the scale.
    // Set X is rated only by the generous ones, set Y by normal raters who
    // like it a lot relative to their own average.
    const rows: RatingRow[] = [];
    for (let i = 0; i < 6; i++) {
      for (const s of ["p", "q", "r", "s"]) rows.push(r(`gen${i}`, s, 9));
      rows.push(r(`gen${i}`, "x", 10));
      for (const s of ["p", "q", "r", "s"]) rows.push(r(`norm${i}`, s, 5));
      rows.push(r(`norm${i}`, "y", 9));
    }
    const { sets } = computeSetScores(rows);
    const x = sets.get("x")!;
    const y = sets.get("y")!;
    expect(x.rawMean).toBeGreaterThan(y.rawMean);
    expect(y.score).toBeGreaterThan(x.score);
  });

  it("barely adjusts a rater with a single rating", () => {
    const rows = [
      ...Array.from({ length: 20 }, (_, i) => r(`u${i}`, "base", 6)),
      r("solo", "base", 10),
    ];
    const { globalMean, sets } = computeSetScores(rows);
    // Solo rater's offset is (10 - mean) / (1 + 3): a quarter of their
    // deviation, not all of it.
    const s = sets.get("base")!;
    expect(s.score).toBeGreaterThan(globalMean);
  });

  it("filters to experienced raters when asked", () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, i) => r(`e${i}`, "aaa", 9, "lots")),
      ...Array.from({ length: 5 }, (_, i) => r(`n${i}`, "aaa", 2, "few")),
    ];
    const all = computeSetScores(rows).sets.get("aaa")!;
    const exp = computeSetScores(rows, { experiencedOnly: true }).sets.get("aaa")!;
    expect(all.count).toBe(10);
    expect(exp.count).toBe(5);
    expect(exp.rawMean).toBe(9);
  });

  it("reports tags picked by at least 30% of raters", () => {
    const rows = [
      r("u1", "aaa", 7, "lots", ["fast", "swingy"]),
      r("u2", "aaa", 7, "lots", ["fast"]),
      r("u3", "aaa", 7, "lots", ["fast", "fast"]),
      r("u4", "aaa", 7, "lots", []),
    ];
    const s = computeSetScores(rows).sets.get("aaa")!;
    expect(s.tags).toEqual([{ tag: "fast", share: 0.75 }]);
  });
});
