import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to extract mana value from mana cost string
function getManaValue(manaCost: string | null): number {
  if (!manaCost) return 0;

  // Remove all non-numeric characters except X
  const numericPart = manaCost.replace(/[^0-9X]/g, '');

  // Count X as 0 for CMC calculation
  const xCount = (manaCost.match(/X/g) || []).length;

  // Extract the generic mana cost (the number in {})
  const genericMatch = manaCost.match(/\{(\d+)\}/);
  const generic = genericMatch ? parseInt(genericMatch[1]) : 0;

  // Count colored and colorless pips (each symbol like {W}, {U}, {B}, etc. = 1)
  const pipCount = (manaCost.match(/\{[WUBRG2-9]\}/g) || []).length;

  return generic + pipCount;
}

// Helper function to check if a card is a creature
function isCreature(typeLine: string): boolean {
  return typeLine.toLowerCase().includes('creature');
}

// Helper function to extract color pair from colors array
function getColorPair(colors: string): string {
  try {
    const colorArray = JSON.parse(colors);
    if (colorArray.length === 0) return 'Colorless';
    if (colorArray.length === 1) return colorArray[0];
    if (colorArray.length === 2) {
      // Sort to ensure consistent pairing (e.g., always "UB" not "BU")
      const sorted = colorArray.sort();
      return sorted.join('');
    }
    return 'Multicolor';
  } catch {
    return 'Unknown';
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setCode = searchParams.get('set');
    const analysisType = searchParams.get('type') || 'mana-value';

    // Base query
    const whereClause = {
      ...(setCode ? { setCode } : {}),
      iihPremier: { not: null },
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
        gamesPlayed: true,
        setCode: true,
      },
    });

    // Calculate total games for GP% calculation
    const totalGames = await prisma.card.aggregate({
      where: whereClause,
      _sum: {
        gamesPlayed: true,
      },
    });

    const totalGamesPlayed = totalGames._sum.gamesPlayed || 1;

    switch (analysisType) {
      case 'mana-value': {
        // IWD vs Mana Value analysis
        const data = cards.map(card => ({
          name: card.name,
          manaValue: getManaValue(card.manaCost),
          iih: card.iihPremier! * 100, // Convert to percentage points
          isCreature: isCreature(card.typeLine),
          gamesPlayed: card.gamesPlayed,
        }));

        return NextResponse.json({ data });
      }

      case 'gp-percent': {
        // IWD vs GP% analysis (situational cards)
        const data = cards.map(card => {
          const gpPercent = (card.gamesPlayed / totalGamesPlayed) * 100;
          return {
            name: card.name,
            gpPercent,
            iih: card.iihPremier! * 100,
            gamesPlayed: card.gamesPlayed,
            typeLine: card.typeLine,
          };
        });

        return NextResponse.json({ data });
      }

      case 'archetype': {
        // Archetype paradox analysis
        const data = cards.map(card => ({
          name: card.name,
          colorPair: getColorPair(card.colors),
          iih: card.iihPremier! * 100,
          gihWr: (card.gihWrPremier || 0) * 100,
          manaValue: getManaValue(card.manaCost),
        }));

        // Group by color pair
        const grouped = data.reduce((acc, card) => {
          if (!acc[card.colorPair]) {
            acc[card.colorPair] = [];
          }
          acc[card.colorPair].push(card.iih);
          return acc;
        }, {} as Record<string, number[]>);

        // Calculate statistics for each color pair
        const statistics = Object.entries(grouped).map(([colorPair, iihs]) => {
          const sorted = iihs.sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const mean = iihs.reduce((a, b) => a + b, 0) / iihs.length;
          const min = Math.min(...iihs);
          const max = Math.max(...iihs);

          return {
            colorPair,
            median,
            mean,
            min,
            max,
            count: iihs.length,
          };
        });

        return NextResponse.json({ data, statistics });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
