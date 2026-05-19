import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/auth/cron-auth";
import { fetchAllSets, filterCandidateSets } from "@/lib/api/scryfall-sets";
import { probeSetHasData } from "@/lib/api/17lands";
import { syncSet } from "@/lib/sync/sync-set";
import { getOverrideParent } from "@/lib/utils/bonus-sheets";
import type { ScryfallSet } from "@/types";

const MIN_RELEASE_DATE = new Date("2018-01-01");

interface DiscoveryResult {
  setCode: string;
  action: "skipped-existing" | "skipped-no-data" | "added" | "added-bonus-sheet" | "error";
  message?: string;
  cardsAdded?: number;
  cardsUpdated?: number;
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const results: DiscoveryResult[] = [];

  let allSets: ScryfallSet[];
  try {
    allSets = await fetchAllSets();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scryfall fetch failed" },
      { status: 502 },
    );
  }

  const candidates = filterCandidateSets(allSets, MIN_RELEASE_DATE);
  const existingMeta = await prisma.setMetadata.findMany({
    select: { setCode: true },
  });
  const existingCodes = new Set(existingMeta.map((s) => s.setCode));

  // Sort so parents are processed before their children in the same run.
  // We're looking for sets that *claim* a parent (Scryfall parent_set_code or
  // override map). Those go last; everything else first.
  candidates.sort((a, b) => {
    const aIsChild = !!(a.parent_set_code || getOverrideParent(a.code));
    const bIsChild = !!(b.parent_set_code || getOverrideParent(b.code));
    if (aIsChild === bIsChild) return 0;
    return aIsChild ? 1 : -1;
  });

  for (const scryfallSet of candidates) {
    const code = scryfallSet.code.toLowerCase();
    if (existingCodes.has(code)) {
      results.push({ setCode: code, action: "skipped-existing" });
      continue;
    }

    const parentSetCode = resolveParent(scryfallSet, existingCodes);

    // For non-bonus-sheets we probe 17lands directly. For bonus sheets we
    // assume the parent has data (the cards are draftable in the parent's
    // packs) and let syncSet do its own probing/fallback.
    if (!parentSetCode) {
      const releaseDate = new Date(scryfallSet.released_at);
      const probeStart = isoDay(
        new Date(releaseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      );
      const probeEnd = isoDay(
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      );
      const hasData = await probeSetHasData(code, probeStart, probeEnd);
      if (!hasData) {
        results.push({
          setCode: code,
          action: "skipped-no-data",
          message: "17lands has no data yet — try again tomorrow",
        });
        continue;
      }
    }

    try {
      await prisma.setMetadata.create({
        data: {
          setCode: code,
          setName: scryfallSet.name,
          releaseDate: new Date(scryfallSet.released_at),
          isSupported: !parentSetCode,
          parentSetCode: parentSetCode ?? null,
          syncStatus: "pending",
        },
      });
      existingCodes.add(code);

      const syncResult = await syncSet(code);
      results.push({
        setCode: code,
        action: parentSetCode ? "added-bonus-sheet" : "added",
        cardsAdded: syncResult.cardsAdded,
        cardsUpdated: syncResult.cardsUpdated,
        message:
          syncResult.status === "error" ? syncResult.error : undefined,
      });
    } catch (error) {
      results.push({
        setCode: code,
        action: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    candidatesConsidered: candidates.length,
    results,
  });
}

function resolveParent(
  scryfallSet: ScryfallSet,
  existingCodes: Set<string>,
): string | null {
  // Prefer Scryfall's own parent_set_code, but only if the parent set is
  // something we already track (otherwise the bonus sheet is meaningless
  // on its own and we want to skip until the parent gets added).
  const scryfallParent = scryfallSet.parent_set_code?.toLowerCase();
  if (scryfallParent && existingCodes.has(scryfallParent)) {
    return scryfallParent;
  }
  const overrideParent = getOverrideParent(scryfallSet.code);
  if (overrideParent && existingCodes.has(overrideParent)) {
    return overrideParent;
  }
  return null;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
