import { prisma } from "@/lib/prisma";
import { MIN_PLAYABLE_CARDS } from "@/lib/utils/constants";

/** Set codes with at least MIN_PLAYABLE_CARDS cards that have an IIH value. */
export async function getPlayableSetCodes(): Promise<string[]> {
  const counts = await prisma.card.groupBy({
    by: ["setCode"],
    where: { iihPremier: { not: null } },
    _count: { _all: true },
  });
  return counts
    .filter((c) => c._count._all >= MIN_PLAYABLE_CARDS)
    .map((c) => c.setCode);
}
