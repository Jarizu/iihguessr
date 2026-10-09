import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/auth/cron-auth";
import { checkSeventeenLandsCanary } from "@/lib/sync/canary";
import { syncSetsWithinBudget } from "@/lib/sync/sync-many";

export const maxDuration = 300;

/**
 * Sets keep accumulating 17lands games for a few months after release; after
 * that the numbers are effectively final, so only recent sets get re-synced.
 */
const REFRESH_WINDOW_DAYS = 90;

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const canaryError = await checkSeventeenLandsCanary();
  if (canaryError) {
    return NextResponse.json({ error: canaryError }, { status: 503 });
  }

  const since = new Date(
    Date.now() - REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const recent = await prisma.setMetadata.findMany({
    where: { isSupported: true, releaseDate: { gte: since } },
    orderBy: { releaseDate: "desc" },
    select: { setCode: true },
  });
  const parentCodes = recent.map((s) => s.setCode);
  // Bonus sheets draw their numbers from the parent's 17lands data, so
  // refresh them alongside it.
  const bonusSheets = await prisma.setMetadata.findMany({
    where: { parentSetCode: { in: parentCodes } },
    select: { setCode: true },
  });

  const { results, remaining } = await syncSetsWithinBudget([
    ...parentCodes,
    ...bonusSheets.map((s) => s.setCode),
  ]);

  const failed = results.some((r) => r.status === "error");
  return NextResponse.json(
    { results, remaining },
    { status: failed ? 500 : 200 },
  );
}
