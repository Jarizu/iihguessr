import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCardPairs, pairToResponse } from "@/lib/pairing/algorithm";
import { DraftFormat, CardPairResponse } from "@/types";
import { DEFAULT_SET, DEFAULT_FORMAT } from "@/lib/utils/constants";
import { METRIC_CONFIG, parseMetric } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const setCode = (searchParams.get("set") || DEFAULT_SET).toLowerCase();
  const format = (searchParams.get("format") || DEFAULT_FORMAT) as DraftFormat;
  const metric = parseMetric(searchParams.get("metric"));
  const count = Math.min(
    Math.max(parseInt(searchParams.get("count") || "3"), 1),
    10,
  );

  const setMeta = await prisma.setMetadata.findUnique({ where: { setCode } });
  if (!setMeta) {
    return NextResponse.json(
      { error: `Unknown set: ${setCode}` },
      { status: 400 },
    );
  }

  try {
    // Pool: this set + any bonus-sheet children
    const children = await prisma.setMetadata.findMany({
      where: { parentSetCode: setCode },
      select: { setCode: true },
    });
    const setCodes = [setCode, ...children.map((c) => c.setCode)];

    const column = METRIC_CONFIG[metric].column;

    const cards = await prisma.card.findMany({
      where: {
        setCode: { in: setCodes },
        isBasicLand: false,
        isSpecialGuest: false,
        [column]: { not: null },
      },
    });

    if (cards.length < 2) {
      return NextResponse.json(
        {
          error: `Not enough cards with ${metric} data for set ${setCode}`,
        },
        { status: 404 },
      );
    }

    const pairs = generateCardPairs(cards, format, metric, count);

    if (pairs.length === 0) {
      return NextResponse.json(
        { error: "Could not generate valid card pairs" },
        { status: 500 },
      );
    }

    const response: CardPairResponse = {
      pairs: pairs.map(([cardA, cardB]) => pairToResponse(cardA, cardB)),
      dataAsOf:
        setMeta.lastSyncedAt?.toISOString() ?? new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating card pairs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
