import { afterEach, describe, expect, it, vi } from "vitest";
import { probeSetHasData } from "./17lands";

function stubRatings(gameCounts: number[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify(gameCounts.map((n, i) => ({ name: `c${i}`, ever_drawn_game_count: n }))),
        { status: 200 },
      ),
    ),
  );
}

describe("probeSetHasData", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects a set with only a handful of games (e.g. The Hobbit)", async () => {
    stubRatings([10, 8, 3, ...Array(185).fill(0)]);
    expect(await probeSetHasData("hob", "2026-08-07", "2026-10-09")).toBe(false);
  });

  it("accepts a set with enough playable cards", async () => {
    stubRatings(Array(250).fill(500));
    expect(await probeSetHasData("fra", "2026-09-25", "2026-10-09")).toBe(true);
  });
});
