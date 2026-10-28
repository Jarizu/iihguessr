import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCardRatings } from "./17lands";

describe("fetchCardRatings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("sends the expansion code uppercased (17lands is case-sensitive)", async () => {
    const fetchMock = stubFetch([]);

    await fetchCardRatings("fra", "PremierDraft");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("expansion")).toBe("FRA");
  });

  it("asks for ALL_TIME, not the endpoint's LAST_DAY default", async () => {
    const fetchMock = stubFetch([]);

    await fetchCardRatings("fra", "PremierDraft");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("time_period")).toBe("ALL_TIME");
    expect(url.searchParams.get("event_type")).toBe("PremierDraft");
  });

  it("uses /api/card_data; /card_ratings/data silently ignores its filters", async () => {
    const fetchMock = stubFetch([]);

    await fetchCardRatings("fra", "PremierDraft");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/card_data");
  });

  it("unwraps the { copyright, notes, data } envelope", async () => {
    stubFetch({
      copyright: "(c) 2026 17Lands LLC",
      notes: "This data is only for use on 17Lands.com.",
      data: [{ name: "Campus Crier", ever_drawn_game_count: 80711 }],
    });

    const cards = await fetchCardRatings("fra", "PremierDraft");

    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("Campus Crier");
  });

  it("still accepts a bare array, as the old endpoint returned", async () => {
    stubFetch([{ name: "Campus Crier", ever_drawn_game_count: 80711 }]);

    const cards = await fetchCardRatings("fra", "PremierDraft");

    expect(cards).toHaveLength(1);
  });

  it("returns an empty array when the payload has no rows", async () => {
    stubFetch({ copyright: "(c) 2026 17Lands LLC", notes: "" });

    await expect(fetchCardRatings("fra", "PremierDraft")).resolves.toEqual([]);
  });
});
