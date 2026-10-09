import { prisma } from "@/lib/prisma";
import { probeSetHasData } from "@/lib/api/17lands";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Check that 17lands still returns data for a set we know has it: the newest
 * supported set released at least two weeks ago. If this comes back empty,
 * 17lands has changed its API and every "no data yet" answer is a lie, so
 * the cron should fail loudly instead of silently skipping new sets.
 *
 * Returns null when healthy (or when there's no set old enough to check),
 * otherwise an error message.
 */
export async function checkSeventeenLandsCanary(
  now: Date = new Date(),
): Promise<string | null> {
  const canary = await prisma.setMetadata.findFirst({
    where: {
      isSupported: true,
      releaseDate: { lte: new Date(now.getTime() - 14 * DAY_MS) },
    },
    orderBy: { releaseDate: "desc" },
    select: { setCode: true, releaseDate: true },
  });
  if (!canary) return null;

  const start = new Date(canary.releaseDate.getTime() - 7 * DAY_MS);
  const end = new Date(now.getTime() + DAY_MS);
  const ok = await probeSetHasData(
    canary.setCode,
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  );
  return ok
    ? null
    : `17lands returned no data for known-good set ${canary.setCode}; its API may have changed`;
}
