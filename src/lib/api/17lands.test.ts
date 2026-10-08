import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCardRatings } from "./17lands";

describe("fetchCardRatings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the expansion code uppercased (17lands is case-sensitive)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("[]", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchCardRatings("fra", "PremierDraft", "2026-09-25", "2026-12-01");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("expansion")).toBe("FRA");
  });
});
