import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GuessRequest, GuessResponse, DraftFormat } from "@/types";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  let body: GuessRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { cardAId, cardBId, selectedCardId, setCode } = body;

  // Validate required fields
  if (!cardAId || !cardBId || !selectedCardId || !setCode) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate selectedCardId is one of the two cards
  if (selectedCardId !== cardAId && selectedCardId !== cardBId) {
    return NextResponse.json(
      { error: "Selected card must be one of the pair" },
      { status: 400 }
    );
  }

  try {
    // Fetch both cards
    const [cardA, cardB] = await Promise.all([
      prisma.card.findUnique({ where: { id: cardAId } }),
      prisma.card.findUnique({ where: { id: cardBId } }),
    ]);

    if (!cardA || !cardB) {
      return NextResponse.json(
        { error: "One or both cards not found" },
        { status: 404 }
      );
    }

    // Get IWD and GIH WR values
    const cardAIwd = cardA.iihPremier;
    const cardBIwd = cardB.iihPremier;
    const cardAGihWr = cardA.gihWrPremier;
    const cardBGihWr = cardB.gihWrPremier;

    if (cardAIwd === null || cardBIwd === null) {
      return NextResponse.json(
        { error: "Cards missing IWD data" },
        { status: 400 }
      );
    }

    // Determine correct answer
    const correctCardId = cardAIwd >= cardBIwd ? cardAId : cardBId;
    const isCorrect = selectedCardId === correctCardId;
    const iihDifference = Math.abs(cardAIwd - cardBIwd);

    // If user is authenticated, persist the guess and stats
    if (userId) {
      // Record the guess
      await prisma.guess.create({
        data: {
          userId,
          cardAId,
          cardBId,
          selectedCardId,
          cardAIih: cardAIwd,
          cardBIih: cardBIwd,
          iihDifference,
          isCorrect,
          setCode,
          format: "PremierDraft",
        },
      });

      // Update user stats
      const stats = await prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalGuesses: 1,
          correctGuesses: isCorrect ? 1 : 0,
          currentStreak: isCorrect ? 1 : 0,
          bestStreak: isCorrect ? 1 : 0,
          setBreakdown: JSON.stringify({
            [setCode]: { total: 1, correct: isCorrect ? 1 : 0 },
          }),
        },
        update: {
          totalGuesses: { increment: 1 },
          correctGuesses: { increment: isCorrect ? 1 : 0 },
          currentStreak: isCorrect ? { increment: 1 } : 0,
        },
      });

      // Update best streak if needed
      const newStreak = isCorrect ? stats.currentStreak + 1 : 0;
      if (newStreak > stats.bestStreak) {
        await prisma.userStats.update({
          where: { userId },
          data: { bestStreak: newStreak },
        });
      }

      // Update set breakdown
      const breakdown = JSON.parse(stats.setBreakdown || "{}");
      if (!breakdown[setCode]) {
        breakdown[setCode] = { total: 0, correct: 0 };
      }
      breakdown[setCode].total += 1;
      if (isCorrect) {
        breakdown[setCode].correct += 1;
      }

      await prisma.userStats.update({
        where: { userId },
        data: { setBreakdown: JSON.stringify(breakdown) },
      });

      // Update biggest miss if this was a big miss
      if (!isCorrect) {
        const shouldUpdateBiggestMiss =
          !stats.biggestMissDiff || iihDifference > stats.biggestMissDiff;

        if (shouldUpdateBiggestMiss) {
          const newGuess = await prisma.guess.findFirst({
            where: {
              userId,
              isCorrect: false,
            },
            orderBy: { iihDifference: "desc" },
          });

          if (newGuess) {
            await prisma.userStats.update({
              where: { userId },
              data: {
                biggestMissId: newGuess.id,
                biggestMissDiff: newGuess.iihDifference,
              },
            });
          }
        }
      }

      const finalStats = await prisma.userStats.findUnique({
        where: { userId },
      });

      const response: GuessResponse = {
        isCorrect,
        cardAIih: cardAIwd,
        cardBIih: cardBIwd,
        cardAGihWr: cardAGihWr ?? 0,
        cardBGihWr: cardBGihWr ?? 0,
        cardAName: cardA.name,
        cardBName: cardB.name,
        cardAScryfallId: cardA.scryfallId,
        cardBScryfallId: cardB.scryfallId,
        setCode: cardA.setCode,
        correctCardId,
        iihDifference,
        newStreak: finalStats?.currentStreak || 0,
        newTotal: finalStats?.totalGuesses || 1,
        newAccuracy: finalStats
          ? (finalStats.correctGuesses / finalStats.totalGuesses) * 100
          : isCorrect
            ? 100
            : 0,
      };

      return NextResponse.json(response);
    }

    // Anonymous user - just return the result without persisting
    // Stats will be tracked client-side
    const response: GuessResponse = {
      isCorrect,
      cardAIih: cardAIwd,
      cardBIih: cardBIwd,
      cardAGihWr: cardAGihWr ?? 0,
      cardBGihWr: cardBGihWr ?? 0,
      cardAName: cardA.name,
      cardBName: cardB.name,
      cardAScryfallId: cardA.scryfallId,
      cardBScryfallId: cardB.scryfallId,
      setCode: cardA.setCode,
      correctCardId,
      iihDifference,
      newStreak: 0, // Client will track this
      newTotal: 0,
      newAccuracy: 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing guess:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
