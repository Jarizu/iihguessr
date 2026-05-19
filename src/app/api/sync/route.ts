import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/auth/cron-auth";
import { syncSet, SyncResult } from "@/lib/sync/sync-set";
import { DraftFormat } from "@/types";

export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const searchParams = request.nextUrl.searchParams;
  const setCode = searchParams.get("set")?.toLowerCase();
  const format = (searchParams.get("format") || "PremierDraft") as DraftFormat;

  const targets = setCode
    ? await prisma.setMetadata.findMany({ where: { setCode } })
    : await prisma.setMetadata.findMany();

  if (setCode && targets.length === 0) {
    return NextResponse.json(
      {
        error: `Unknown set: ${setCode}. Run /api/sync/discover first or seed it.`,
      },
      { status: 400 },
    );
  }

  const results: SyncResult[] = [];
  for (const meta of targets) {
    results.push(await syncSet(meta.setCode, { format }));
  }

  return NextResponse.json({ results });
}

export async function GET() {
  const sets = await prisma.setMetadata.findMany({
    orderBy: { releaseDate: "desc" },
  });
  return NextResponse.json({ sets });
}
