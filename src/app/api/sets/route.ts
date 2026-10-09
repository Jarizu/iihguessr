import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayableSetCodes } from "@/lib/sync/playable";

export interface SupportedSetResponse {
  code: string;
  name: string;
  releaseDate: string;
  lastSyncedAt: string | null;
}

/**
 * Returns the list of sets that the picker should show. Bonus sheets
 * (parentSetCode != null, isSupported: false) are excluded, as are sets
 * without enough cards with IIH data to play.
 */
export async function GET() {
  const sets = await prisma.setMetadata.findMany({
    where: { isSupported: true },
    orderBy: { releaseDate: "desc" },
    select: {
      setCode: true,
      setName: true,
      releaseDate: true,
      lastSyncedAt: true,
    },
  });

  const playable = new Set(await getPlayableSetCodes());

  const response: SupportedSetResponse[] = sets
    .filter((s) => playable.has(s.setCode))
    .map((s) => ({
      code: s.setCode,
      name: s.setName,
      releaseDate: s.releaseDate.toISOString().slice(0, 10),
      lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
    }));

  return NextResponse.json({ sets: response });
}
