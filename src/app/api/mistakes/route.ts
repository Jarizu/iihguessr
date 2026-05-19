import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MistakeItem, CardWithValue } from "@/types";
import { parseColors } from "@/lib/utils/colors";
import { parseMetric } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "20"), 1),
    100,
  );
  const sort = searchParams.get("sort") || "difference"; // "difference" or "recent"
  const setFilter = searchParams.get("set");
  const metricFilter = searchParams.get("metric");

  try {
    const mistakes = await prisma.guess.findMany({
      where: {
        userId: session.user.id,
        isCorrect: false,
        ...(setFilter ? { setCode: setFilter } : {}),
        ...(metricFilter ? { metric: metricFilter } : {}),
      },
      include: { cardA: true, cardB: true },
      orderBy:
        sort === "recent" ? { createdAt: "desc" } : { valueDifference: "desc" },
      take: limit,
    });

    const response: MistakeItem[] = mistakes.map((mistake) => {
      const metric = parseMetric(mistake.metric);

      const cardA: CardWithValue = {
        id: mistake.cardA.id,
        name: mistake.cardA.name,
        imageUri: mistake.cardA.imageUri,
        imageUriLarge: mistake.cardA.imageUriLarge,
        setCode: mistake.cardA.setCode,
        colors: parseColors(mistake.cardA.colors),
        rarity: mistake.cardA.rarity,
        typeLine: mistake.cardA.typeLine,
        manaCost: mistake.cardA.manaCost,
        value: mistake.cardAValue,
        metric,
      };

      const cardB: CardWithValue = {
        id: mistake.cardB.id,
        name: mistake.cardB.name,
        imageUri: mistake.cardB.imageUri,
        imageUriLarge: mistake.cardB.imageUriLarge,
        setCode: mistake.cardB.setCode,
        colors: parseColors(mistake.cardB.colors),
        rarity: mistake.cardB.rarity,
        typeLine: mistake.cardB.typeLine,
        manaCost: mistake.cardB.manaCost,
        value: mistake.cardBValue,
        metric,
      };

      return {
        id: mistake.id,
        cardA,
        cardB,
        selectedCardId: mistake.selectedCardId,
        valueDifference: mistake.valueDifference,
        metric,
        createdAt: mistake.createdAt.toISOString(),
        setCode: mistake.setCode,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching mistakes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
