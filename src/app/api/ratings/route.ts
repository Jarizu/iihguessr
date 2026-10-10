import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSetScores } from "@/lib/ratings/score";
import { buildRankings } from "@/lib/ratings/rankings";

/**
 * Public set rankings. `?experienced=1` scores only raters with 6+ drafts.
 * Signed-in callers also get their own ratings in `mine`. Individual
 * ratings are never exposed.
 */
export async function GET(request: NextRequest) {
  const experiencedOnly =
    request.nextUrl.searchParams.get("experienced") === "1";

  const [sets, rows, session] = await Promise.all([
    prisma.setMetadata.findMany({
      where: { isSupported: true },
      select: { setCode: true, setName: true, releaseDate: true },
    }),
    prisma.setRating.findMany({
      select: {
        userId: true,
        setCode: true,
        fun: true,
        experience: true,
        tags: true,
      },
    }),
    getServerSession(authOptions),
  ]);

  const { globalMean, sets: scores } = computeSetScores(rows, {
    experiencedOnly,
  });
  const rankings = buildRankings(
    sets.map((s) => ({
      code: s.setCode,
      name: s.setName,
      releaseDate: s.releaseDate,
    })),
    scores,
  );

  const userId = session?.user?.id;
  const mine = userId
    ? Object.fromEntries(
        rows
          .filter((r) => r.userId === userId)
          .map((r) => [
            r.setCode,
            { fun: r.fun, experience: r.experience, tags: r.tags },
          ]),
      )
    : null;

  return NextResponse.json({
    totalRatings: rows.length,
    globalMean: Math.round(globalMean * 10) / 10,
    sets: rankings,
    mine,
  });
}
