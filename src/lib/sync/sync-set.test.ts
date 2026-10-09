import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetchRatings, mockFetchSetCards, prismaMock } = vi.hoisted(() => ({
  mockFetchRatings: vi.fn(),
  mockFetchSetCards: vi.fn(),
  prismaMock: {
    setMetadata: { findUnique: vi.fn(), update: vi.fn() },
    dataSyncLog: { create: vi.fn(), update: vi.fn() },
    card: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/api/17lands", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/17lands")>(
    "@/lib/api/17lands",
  );
  return { ...actual, fetchCardRatings: mockFetchRatings };
});
vi.mock("@/lib/api/scryfall", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/scryfall")>(
    "@/lib/api/scryfall",
  );
  return { ...actual, fetchSetCards: mockFetchSetCards };
});

import { syncSet } from "./sync-set";

describe("syncSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.setMetadata.findUnique.mockResolvedValue({
      setCode: "msh",
      releaseDate: new Date("2026-06-26"),
      parentSetCode: null,
    });
    prismaMock.dataSyncLog.create.mockResolvedValue({ id: "log1" });
  });

  it("leaves stored stats alone when 17lands returns only a few games", async () => {
    // What 17lands now returns for a non-current set like MSH.
    mockFetchRatings.mockResolvedValue([
      { name: "a", ever_drawn_game_count: 6 },
      { name: "b", ever_drawn_game_count: 3 },
    ]);
    prismaMock.card.count.mockResolvedValue(240);

    const result = await syncSet("msh");

    expect(result.status).toBe("skipped");
    expect(result.error).toMatch(/left existing data unchanged/);
    expect(mockFetchSetCards).not.toHaveBeenCalled();
    expect(prismaMock.card.update).not.toHaveBeenCalled();
    expect(prismaMock.card.create).not.toHaveBeenCalled();
  });

  it("skips when the response is far thinner than what's stored", async () => {
    mockFetchRatings.mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => ({ name: `c${i}`, ever_drawn_game_count: 100 })),
    );
    prismaMock.card.count.mockResolvedValue(240);

    const result = await syncSet("msh");

    expect(result.status).toBe("skipped");
    expect(prismaMock.card.update).not.toHaveBeenCalled();
  });
});
