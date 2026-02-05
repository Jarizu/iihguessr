import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCardPairs, pairToResponse } from "@/lib/pairing/algorithm";
import { DraftFormat, CardPairResponse } from "@/types";
import { SUPPORTED_SETS, DEFAULT_SET, DEFAULT_FORMAT } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const setCode = searchParams.get("set") || DEFAULT_SET;
  const format = (searchParams.get("format") || DEFAULT_FORMAT) as DraftFormat;
  const count = Math.min(Math.max(parseInt(searchParams.get("count") || "3"), 1), 10);

  // Validate set code
  if (!SUPPORTED_SETS.some((s) => s.code === setCode)) {
    return NextResponse.json(
      { error: `Invalid set code: ${setCode}` },
      { status: 400 }
    );
  }

  try {
    // Fetch cards from database
    const cards = await prisma.card.findMany({
      where: {
        setCode,
        isBasicLand: false,
        isSpecialGuest: false,
        iihPremier: { not: null },
      },
    });

    if (cards.length < 2) {
      return NextResponse.json(
        { error: `Not enough cards with data for set ${setCode}` },
        { status: 404 }
      );
    }

    // Generate pairs
    const pairs = generateCardPairs(cards, format, count);

    if (pairs.length === 0) {
      return NextResponse.json(
        { error: "Could not generate valid card pairs" },
        { status: 500 }
      );
    }

    // Get last sync time
    const setMeta = await prisma.setMetadata.findUnique({
      where: { setCode },
    });

    const response: CardPairResponse = {
      pairs: pairs.map(([cardA, cardB]) => pairToResponse(cardA, cardB)),
      dataAsOf: setMeta?.lastSyncedAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating card pairs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
