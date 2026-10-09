import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetchRatings, mockFetchSetCards, prismaMock } = vi.hoisted(() => ({
  mockFetchRatings: vi.fn(),
  mockFetchSetCards: vi.fn(),
  prismaMock: {
    setMetadata: { findUnique: vi.fn(), update: vi.fn() },
    dataSyncLog: { create: vi.fn(), update: vi.fn() },
    card: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
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

  it("refuses to overwrite card stats when 17lands returns no games", async () => {
    mockFetchRatings.mockResolvedValue([]);

    const result = await syncSet("msh");

    expect(result.status).toBe("error");
    expect(result.error).toMatch(/refusing to overwrite/);
    expect(mockFetchSetCards).not.toHaveBeenCalled();
    expect(prismaMock.card.update).not.toHaveBeenCalled();
    expect(prismaMock.card.create).not.toHaveBeenCalled();
  });
});
