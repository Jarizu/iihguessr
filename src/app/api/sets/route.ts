import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface SupportedSetResponse {
  code: string;
  name: string;
  releaseDate: string;
  lastSyncedAt: string | null;
}

/**
 * Returns the list of sets that the picker should show. Bonus sheets
 * (parentSetCode != null, isSupported: false) are excluded.
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

  const response: SupportedSetResponse[] = sets.map((s) => ({
    code: s.setCode,
    name: s.setName,
    releaseDate: s.releaseDate.toISOString().slice(0, 10),
    lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ sets: response });
}
