import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks must be declared before the SUT import ---
const { mockFindMany, mockCreate, mockFetchAllSets, mockProbe, mockSyncSet } =
  vi.hoisted(() => ({
    mockFindMany: vi.fn(),
    mockCreate: vi.fn(),
    mockFetchAllSets: vi.fn(),
    mockProbe: vi.fn(),
    mockSyncSet: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    setMetadata: {
      findMany: mockFindMany,
      create: mockCreate,
    },
  },
}));

vi.mock("@/lib/api/scryfall-sets", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/api/scryfall-sets")
  >("@/lib/api/scryfall-sets");
  return {
    ...actual,
    fetchAllSets: mockFetchAllSets,
  };
});

vi.mock("@/lib/api/17lands", () => ({
  probeSetHasData: mockProbe,
}));

vi.mock("@/lib/sync/sync-set", () => ({
  syncSet: mockSyncSet,
}));

// --- Now import the SUT ---
import { GET } from "./route";

function makeReq(headers: Record<string, string> = {}) {
  return new NextRequest("https://example.com/api/sync/discover", { headers });
}

const futureDateInWindow = () => {
  // Within the candidate filter's [2018-01-01, now+7d] window
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

describe("/api/sync/discover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 401 without the cron secret", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 with a wrong secret", async () => {
    const res = await GET(makeReq({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("accepts Bearer header and accepts x-cron-secret header", async () => {
    mockFetchAllSets.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);

    const r1 = await GET(makeReq({ authorization: "Bearer test-secret" }));
    expect(r1.status).toBe(200);

    const r2 = await GET(makeReq({ "x-cron-secret": "test-secret" }));
    expect(r2.status).toBe(200);
  });

  it("skips sets already in SetMetadata", async () => {
    mockFetchAllSets.mockResolvedValue([
      {
        code: "abc",
        name: "Already Synced",
        released_at: futureDateInWindow(),
        set_type: "expansion",
        digital: false,
        card_count: 250,
      },
    ]);
    mockFindMany.mockResolvedValue([{ setCode: "abc" }]);

    const res = await GET(makeReq({ authorization: "Bearer test-secret" }));
    const json = await res.json();

    expect(json.results).toHaveLength(1);
    expect(json.results[0].action).toBe("skipped-existing");
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockSyncSet).not.toHaveBeenCalled();
  });

  it("skips a set when 17lands has no data yet", async () => {
    mockFetchAllSets.mockResolvedValue([
      {
        code: "new",
        name: "Brand New Set",
        released_at: futureDateInWindow(),
        set_type: "expansion",
        digital: false,
        card_count: 250,
      },
    ]);
    mockFindMany.mockResolvedValue([]);
    mockProbe.mockResolvedValue(false);

    const res = await GET(makeReq({ authorization: "Bearer test-secret" }));
    const json = await res.json();

    expect(json.results[0].action).toBe("skipped-no-data");
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockSyncSet).not.toHaveBeenCalled();
  });

  it("creates SetMetadata and syncs when 17lands has data", async () => {
    mockFetchAllSets.mockResolvedValue([
      {
        code: "new",
        name: "Brand New Set",
        released_at: futureDateInWindow(),
        set_type: "expansion",
        digital: false,
        card_count: 250,
      },
    ]);
    mockFindMany.mockResolvedValue([]);
    mockProbe.mockResolvedValue(true);
    mockSyncSet.mockResolvedValue({
      setCode: "new",
      status: "success",
      cardsAdded: 250,
      cardsUpdated: 0,
    });

    const res = await GET(makeReq({ authorization: "Bearer test-secret" }));
    const json = await res.json();

    expect(json.results[0].action).toBe("added");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        setCode: "new",
        setName: "Brand New Set",
        isSupported: true,
        parentSetCode: null,
      }),
    });
    expect(mockSyncSet).toHaveBeenCalledWith("new");
  });

  it("links a bonus sheet to its parent via Scryfall parent_set_code", async () => {
    mockFetchAllSets.mockResolvedValue([
      {
        code: "sta",
        name: "Strixhaven: Mystical Archive",
        released_at: futureDateInWindow(),
        set_type: "masterpiece",
        parent_set_code: "stx",
        digital: false,
        card_count: 63,
      },
    ]);
    mockFindMany.mockResolvedValue([{ setCode: "stx" }]); // parent already known
    mockSyncSet.mockResolvedValue({
      setCode: "sta",
      status: "success",
      cardsAdded: 63,
      cardsUpdated: 0,
    });

    const res = await GET(makeReq({ authorization: "Bearer test-secret" }));
    const json = await res.json();

    expect(json.results[0].action).toBe("added-bonus-sheet");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        setCode: "sta",
        isSupported: false,
        parentSetCode: "stx",
      }),
    });
    // No probing for bonus sheets — we trust the parent's data
    expect(mockProbe).not.toHaveBeenCalled();
  });

  it("processes parents before children in the same run", async () => {
    // STA listed first in Scryfall response; STX should still get created first
    mockFetchAllSets.mockResolvedValue([
      {
        code: "sta",
        name: "Strixhaven: Mystical Archive",
        released_at: futureDateInWindow(),
        set_type: "masterpiece",
        parent_set_code: "stx",
        digital: false,
        card_count: 63,
      },
      {
        code: "stx",
        name: "Strixhaven",
        released_at: futureDateInWindow(),
        set_type: "expansion",
        digital: false,
        card_count: 275,
      },
    ]);
    mockFindMany.mockResolvedValue([]);
    mockProbe.mockResolvedValue(true);
    mockSyncSet.mockResolvedValue({ status: "success", cardsAdded: 0, cardsUpdated: 0 });

    await GET(makeReq({ authorization: "Bearer test-secret" }));

    const createOrder = mockCreate.mock.calls.map((c) => c[0].data.setCode);
    expect(createOrder).toEqual(["stx", "sta"]);

    const staCall = mockCreate.mock.calls.find((c) => c[0].data.setCode === "sta");
    expect(staCall![0].data.parentSetCode).toBe("stx");
  });
});
