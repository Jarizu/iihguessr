import { describe, expect, it } from "vitest";
import { buildRankings } from "./rankings";
import type { SetScore } from "./score";

const set = (code: string, releaseDate: string) => ({
  code,
  name: code.toUpperCase(),
  releaseDate: new Date(releaseDate),
});
const score = (setCode: string, s: number, count: number): SetScore => ({
  setCode,
  count,
  rawMean: s,
  score: s,
  ranked: count >= 5,
  tags: [],
});

describe("buildRankings", () => {
  it("ranks scored sets, then lists the rest without a score", () => {
    const sets = [
      set("old", "2019-01-01"),
      set("new", "2026-10-02"),
      set("mid", "2023-01-01"),
      set("none", "2025-01-01"),
    ];
    const scores = new Map([
      ["old", score("old", 7.26, 12)],
      ["mid", score("mid", 8.1, 6)],
      ["new", score("new", 9.9, 2)],
    ]);

    const out = buildRankings(sets, scores);

    expect(out.map((r) => r.code)).toEqual(["mid", "old", "new", "none"]);
    expect(out.map((r) => r.rank)).toEqual([1, 2, null, null]);
    expect(out[1].score).toBe(7.3);
    expect(out[2]).toMatchObject({ score: null, count: 2 });
    expect(out[3]).toMatchObject({ score: null, count: 0 });
    expect(out[0]).not.toHaveProperty("rawScore");
  });
});
