import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockSession, prismaMock } = vi.hoisted(() => ({
  mockSession: vi.fn(),
  prismaMock: {
    setMetadata: { findUnique: vi.fn(), count: vi.fn() },
    setRating: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({ getServerSession: mockSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { DELETE, PUT } from "./route";

const put = (body: unknown, setCode = "FRA") =>
  PUT(
    new NextRequest(`https://example.com/api/ratings/${setCode}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ setCode }) },
  );

describe("PUT /api/ratings/[setCode]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    prismaMock.setMetadata.findUnique.mockResolvedValue({
      isSupported: true,
      releaseDate: new Date("2026-10-02"),
    });
    prismaMock.setMetadata.count.mockResolvedValue(0);
    prismaMock.setRating.upsert.mockImplementation(async ({ create }) => create);
  });

  it("requires sign-in", async () => {
    mockSession.mockResolvedValue(null);
    const res = await put({ fun: 8, experience: "lots" });
    expect(res.status).toBe(401);
    expect(prismaMock.setRating.upsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid rating", async () => {
    const res = await put({ fun: 11, experience: "lots" });
    expect(res.status).toBe(400);
  });

  it("404s for an unknown or bonus-sheet set", async () => {
    prismaMock.setMetadata.findUnique.mockResolvedValue({
      isSupported: false,
      releaseDate: new Date("2021-04-23"),
    });
    const res = await put({ fun: 8, experience: "lots" }, "sta");
    expect(res.status).toBe(404);
  });

  it("saves the rating for the signed-in user, lowercasing the set code", async () => {
    const res = await put({ fun: 8, experience: "lots", tags: ["fast"] });
    expect(res.status).toBe(200);
    expect(prismaMock.setRating.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_setCode: { userId: "user1", setCode: "fra" } },
        create: expect.objectContaining({
          userId: "user1",
          setCode: "fra",
          fun: 8,
          experience: "lots",
          tags: ["fast"],
          ratedWhileCurrent: true,
        }),
      }),
    );
  });

  it("marks a rating as hindsight when a newer set has been released", async () => {
    prismaMock.setMetadata.count.mockResolvedValue(1);
    await put({ fun: 6, experience: "some" });
    expect(prismaMock.setRating.upsert.mock.calls[0][0].create.ratedWhileCurrent).toBe(false);
  });
});

describe("DELETE /api/ratings/[setCode]", () => {
  it("deletes only the signed-in user's rating", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    const res = await DELETE(new NextRequest("https://example.com/api/ratings/fra"), {
      params: Promise.resolve({ setCode: "fra" }),
    });
    expect(res.status).toBe(200);
    expect(prismaMock.setRating.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user1", setCode: "fra" },
    });
  });
});
