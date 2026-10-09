import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/auth/cron-auth";
import { syncSetsWithinBudget } from "@/lib/sync/sync-many";
import { DraftFormat } from "@/types";

export const maxDuration = 300;

/**
 * Re-sync one set (`?set=xyz`) or every set. Syncing every set takes longer
 * than one function call allows, so this does as many as fit (least recently
 * synced first) and returns the rest in `remaining`.
 * `scripts/refresh-all.mjs` calls it one set at a time instead.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const searchParams = request.nextUrl.searchParams;
  const setCode = searchParams.get("set")?.toLowerCase();
  const format = (searchParams.get("format") || "PremierDraft") as DraftFormat;

  const targets = setCode
    ? await prisma.setMetadata.findMany({ where: { setCode } })
    : await prisma.setMetadata.findMany({
        orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
      });

  if (setCode && targets.length === 0) {
    return NextResponse.json(
      {
        error: `Unknown set: ${setCode}. Run /api/sync/discover first or seed it.`,
      },
      { status: 400 },
    );
  }

  const { results, remaining } = await syncSetsWithinBudget(
    targets.map((t) => t.setCode),
    { format },
  );

  return NextResponse.json({ results, remaining });
}

export async function GET() {
  const sets = await prisma.setMetadata.findMany({
    orderBy: { releaseDate: "desc" },
  });
  return NextResponse.json({ sets });
}
