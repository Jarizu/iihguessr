import { describe, expect, it, vi } from "vitest";

const { mockSyncSet } = vi.hoisted(() => ({ mockSyncSet: vi.fn() }));
vi.mock("@/lib/sync/sync-set", () => ({ syncSet: mockSyncSet }));

import { syncSetsWithinBudget } from "./sync-many";

describe("syncSetsWithinBudget", () => {
  it("syncs every set when the budget allows", async () => {
    mockSyncSet.mockImplementation(async (code: string) => ({
      setCode: code,
      status: "success",
      cardsAdded: 0,
      cardsUpdated: 1,
    }));
    const out = await syncSetsWithinBudget(["a", "b"]);
    expect(out.results.map((r) => r.setCode)).toEqual(["a", "b"]);
    expect(out.remaining).toEqual([]);
  });

  it("stops starting new sets once the budget is spent", async () => {
    let t = 0;
    mockSyncSet.mockReset();
    mockSyncSet.mockImplementation(async (code: string) => {
      t += 100;
      return { setCode: code, status: "success", cardsAdded: 0, cardsUpdated: 0 };
    });
    const out = await syncSetsWithinBudget(["a", "b", "c", "d"], {
      budgetMs: 150,
      now: () => t,
    });
    expect(out.results.map((r) => r.setCode)).toEqual(["a", "b"]);
    expect(out.remaining).toEqual(["c", "d"]);
  });
});
