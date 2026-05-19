import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GuessRequest, GuessResponse } from "@/types";
import {
  METRIC_CONFIG,
  parseMetric,
  correctCardId as pickCorrectId,
} from "@/lib/metrics";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  let body: GuessRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cardAId, cardBId, selectedCardId, setCode } = body;
  const metric = parseMetric(body.metric);

  if (!cardAId || !cardBId || !selectedCardId || !setCode) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (selectedCardId !== cardAId && selectedCardId !== cardBId) {
    return NextResponse.json(
      { error: "Selected card must be one of the pair" },
      { status: 400 },
    );
  }

  try {
    const [cardA, cardB] = await Promise.all([
      prisma.card.findUnique({ where: { id: cardAId } }),
      prisma.card.findUnique({ where: { id: cardBId } }),
    ]);

    if (!cardA || !cardB) {
      return NextResponse.json(
        { error: "One or both cards not found" },
        { status: 404 },
      );
    }

    const column = METRIC_CONFIG[metric].column;
    const valueA = cardA[column] as number | null;
    const valueB = cardB[column] as number | null;

    if (valueA === null || valueB === null) {
      return NextResponse.json(
        { error: `Cards missing ${metric} data` },
        { status: 400 },
      );
    }

    const correctCardId = pickCorrectId(metric, cardAId, valueA, cardBId, valueB);
    const isCorrect = selectedCardId === correctCardId;
    const valueDifference = Math.abs(valueA - valueB);

    if (userId) {
      await prisma.guess.create({
        data: {
          userId,
          cardAId,
          cardBId,
          selectedCardId,
          metric,
          cardAValue: valueA,
          cardBValue: valueB,
          valueDifference,
          isCorrect,
          setCode,
          format: "PremierDraft",
        },
      });

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
          metricBreakdown: JSON.stringify({
            [metric]: { total: 1, correct: isCorrect ? 1 : 0 },
          }),
        },
        update: {
          totalGuesses: { increment: 1 },
          correctGuesses: { increment: isCorrect ? 1 : 0 },
          currentStreak: isCorrect ? { increment: 1 } : 0,
        },
      });

      const newStreak = isCorrect ? stats.currentStreak + 1 : 0;
      if (newStreak > stats.bestStreak) {
        await prisma.userStats.update({
          where: { userId },
          data: { bestStreak: newStreak },
        });
      }

      // Per-set breakdown
      const setBreakdown = JSON.parse(stats.setBreakdown || "{}");
      if (!setBreakdown[setCode]) setBreakdown[setCode] = { total: 0, correct: 0 };
      setBreakdown[setCode].total += 1;
      if (isCorrect) setBreakdown[setCode].correct += 1;

      // Per-metric breakdown
      const metricBreakdown = JSON.parse(stats.metricBreakdown || "{}");
      if (!metricBreakdown[metric]) metricBreakdown[metric] = { total: 0, correct: 0 };
      metricBreakdown[metric].total += 1;
      if (isCorrect) metricBreakdown[metric].correct += 1;

      await prisma.userStats.update({
        where: { userId },
        data: {
          setBreakdown: JSON.stringify(setBreakdown),
          metricBreakdown: JSON.stringify(metricBreakdown),
        },
      });

      // Biggest miss — tracked across all metrics, but tagged with the metric
      // it was made under so the stats page can label it correctly.
      if (!isCorrect) {
        // Biggest miss is now metric-specific (different scales — pp vs picks).
        // We compare within the same metric to decide if this beats the current
        // record for that metric. Cross-metric "biggest miss" wouldn't be
        // meaningful.
        const shouldUpdate =
          !stats.biggestMissDiff ||
          stats.biggestMissMetric !== metric ||
          valueDifference > stats.biggestMissDiff;

        if (shouldUpdate) {
          const newGuess = await prisma.guess.findFirst({
            where: { userId, isCorrect: false, metric },
            orderBy: { valueDifference: "desc" },
          });
          if (newGuess) {
            await prisma.userStats.update({
              where: { userId },
              data: {
                biggestMissId: newGuess.id,
                biggestMissDiff: newGuess.valueDifference,
                biggestMissMetric: metric,
              },
            });
          }
        }
      }

      const finalStats = await prisma.userStats.findUnique({ where: { userId } });

      return NextResponse.json(buildResponse({
        isCorrect,
        metric,
        valueA,
        valueB,
        valueDifference,
        cardA,
        cardB,
        correctCardId,
        newStreak: finalStats?.currentStreak ?? 0,
        newTotal: finalStats?.totalGuesses ?? 1,
        newAccuracy: finalStats
          ? (finalStats.correctGuesses / finalStats.totalGuesses) * 100
          : isCorrect
            ? 100
            : 0,
      }));
    }

    // Anonymous: stats tracked client-side
    return NextResponse.json(buildResponse({
      isCorrect,
      metric,
      valueA,
      valueB,
      valueDifference,
      cardA,
      cardB,
      correctCardId,
      newStreak: 0,
      newTotal: 0,
      newAccuracy: 0,
    }));
  } catch (error) {
    console.error("Error processing guess:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

interface BuildArgs {
  isCorrect: boolean;
  metric: ReturnType<typeof parseMetric>;
  valueA: number;
  valueB: number;
  valueDifference: number;
  cardA: {
    name: string;
    scryfallId: string;
    setCode: string;
    iihPremier: number | null;
    gihWrPremier: number | null;
    alsaPremier: number | null;
  };
  cardB: {
    name: string;
    scryfallId: string;
    iihPremier: number | null;
    gihWrPremier: number | null;
    alsaPremier: number | null;
  };
  correctCardId: string;
  newStreak: number;
  newTotal: number;
  newAccuracy: number;
}

function buildResponse(args: BuildArgs): GuessResponse {
  return {
    isCorrect: args.isCorrect,
    metric: args.metric,
    cardAValue: args.valueA,
    cardBValue: args.valueB,
    valueDifference: args.valueDifference,
    cardAIih: args.cardA.iihPremier,
    cardBIih: args.cardB.iihPremier,
    cardAGihWr: args.cardA.gihWrPremier,
    cardBGihWr: args.cardB.gihWrPremier,
    cardAAlsa: args.cardA.alsaPremier,
    cardBAlsa: args.cardB.alsaPremier,
    cardAName: args.cardA.name,
    cardBName: args.cardB.name,
    cardAScryfallId: args.cardA.scryfallId,
    cardBScryfallId: args.cardB.scryfallId,
    setCode: args.cardA.setCode,
    correctCardId: args.correctCardId,
    newStreak: args.newStreak,
    newTotal: args.newTotal,
    newAccuracy: args.newAccuracy,
  };
}
