import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsResponse, SetStats } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const stats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    if (!stats) {
      // Return empty stats for new users
      const response: StatsResponse = {
        totalGuesses: 0,
        correctGuesses: 0,
        accuracy: 0,
        currentStreak: 0,
        bestStreak: 0,
        setBreakdown: {},
      };
      return NextResponse.json(response);
    }

    // Parse set breakdown and calculate accuracies
    const rawBreakdown = JSON.parse(stats.setBreakdown || "{}");
    const setBreakdown: Record<string, SetStats> = {};

    for (const [setCode, data] of Object.entries(rawBreakdown)) {
      const d = data as { total: number; correct: number };
      setBreakdown[setCode] = {
        total: d.total,
        correct: d.correct,
        accuracy: d.total > 0 ? (d.correct / d.total) * 100 : 0,
      };
    }

    // Get biggest miss details if exists
    let biggestMiss: StatsResponse["biggestMiss"] | undefined;

    if (stats.biggestMissId) {
      const missGuess = await prisma.guess.findUnique({
        where: { id: stats.biggestMissId },
        include: {
          cardA: true,
          cardB: true,
        },
      });

      if (missGuess) {
        const selectedCard =
          missGuess.selectedCardId === missGuess.cardAId
            ? missGuess.cardA
            : missGuess.cardB;

        biggestMiss = {
          cardA: {
            name: missGuess.cardA.name,
            iih: missGuess.cardAIih,
          },
          cardB: {
            name: missGuess.cardB.name,
            iih: missGuess.cardBIih,
          },
          selectedName: selectedCard.name,
          difference: missGuess.iihDifference,
          date: missGuess.createdAt.toISOString(),
        };
      }
    }

    const response: StatsResponse = {
      totalGuesses: stats.totalGuesses,
      correctGuesses: stats.correctGuesses,
      accuracy:
        stats.totalGuesses > 0
          ? (stats.correctGuesses / stats.totalGuesses) * 100
          : 0,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      setBreakdown,
      biggestMiss,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
