import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { METRIC_CONFIG, parseMetric } from "@/lib/metrics";

function getManaValue(manaCost: string | null): number {
  if (!manaCost) return 0;
  const genericMatch = manaCost.match(/\{(\d+)\}/);
  const generic = genericMatch ? parseInt(genericMatch[1]) : 0;
  const pipCount = (manaCost.match(/\{[WUBRG2-9]\}/g) || []).length;
  return generic + pipCount;
}

function isCreature(typeLine: string): boolean {
  return typeLine.toLowerCase().includes("creature");
}

function getColorPair(colors: string): string {
  try {
    const colorArray = JSON.parse(colors);
    if (colorArray.length === 0) return "Colorless";
    if (colorArray.length === 1) return colorArray[0];
    if (colorArray.length === 2) {
      const sorted = colorArray.sort();
      return sorted.join("");
    }
    return "Multicolor";
  } catch {
    return "Unknown";
  }
}

/**
 * IIH and GIH WR are stored as 0..1 fractions; scale them ×100 for chart axes.
 * ALSA is already on a 1..14 picks scale and is left raw.
 */
function scaleForDisplay(value: number, metric: ReturnType<typeof parseMetric>): number {
  return metric === "ALSA" ? value : value * 100;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setCode = searchParams.get("set");
    const analysisType = searchParams.get("type") || "mana-value";
    const metric = parseMetric(searchParams.get("metric"));
    const column = METRIC_CONFIG[metric].column;

    const whereClause = {
      ...(setCode ? { setCode } : {}),
      [column]: { not: null },
      isBasicLand: false,
      isSpecialGuest: false,
    };

    const cards = await prisma.card.findMany({
      where: whereClause,
      select: {
        name: true,
        manaCost: true,
        typeLine: true,
        colors: true,
        iihPremier: true,
        gihWrPremier: true,
        alsaPremier: true,
        gamesPlayed: true,
        setCode: true,
      },
    });

    const totalGames = await prisma.card.aggregate({
      where: whereClause,
      _sum: { gamesPlayed: true },
    });
    const totalGamesPlayed = totalGames._sum.gamesPlayed || 1;

    const getValue = (card: (typeof cards)[number]): number =>
      scaleForDisplay(card[column] as number, metric);

    switch (analysisType) {
      case "mana-value": {
        const data = cards.map((card) => ({
          name: card.name,
          manaValue: getManaValue(card.manaCost),
          value: getValue(card),
          metric,
          isCreature: isCreature(card.typeLine),
          gamesPlayed: card.gamesPlayed,
        }));
        return NextResponse.json({ data, metric });
      }

      case "gp-percent": {
        const data = cards.map((card) => {
          const gpPercent = (card.gamesPlayed / totalGamesPlayed) * 100;
          return {
            name: card.name,
            gpPercent,
            value: getValue(card),
            metric,
            gamesPlayed: card.gamesPlayed,
            typeLine: card.typeLine,
          };
        });
        return NextResponse.json({ data, metric });
      }

      case "archetype": {
        const data = cards.map((card) => ({
          name: card.name,
          colorPair: getColorPair(card.colors),
          value: getValue(card),
          metric,
          gihWr: (card.gihWrPremier || 0) * 100,
          manaValue: getManaValue(card.manaCost),
        }));

        const grouped = data.reduce(
          (acc, card) => {
            if (!acc[card.colorPair]) acc[card.colorPair] = [];
            acc[card.colorPair].push(card.value);
            return acc;
          },
          {} as Record<string, number[]>,
        );

        const statistics = Object.entries(grouped).map(([colorPair, values]) => {
          const sorted = values.sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          return { colorPair, median, mean, min, max, count: values.length };
        });

        return NextResponse.json({ data, statistics, metric });
      }

      default:
        return NextResponse.json(
          { error: "Invalid analysis type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
