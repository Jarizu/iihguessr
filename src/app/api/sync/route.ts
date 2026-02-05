import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchCardRatings, getIwd, parseSeventeenLandsColors } from "@/lib/api/17lands";
import { fetchSetCards, getCardImageUri, isBasicLand, isSpecialGuest } from "@/lib/api/scryfall";
import { SUPPORTED_SETS } from "@/lib/utils/constants";
import { DraftFormat } from "@/types";

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const setCode = searchParams.get("set");
  const format = (searchParams.get("format") || "PremierDraft") as DraftFormat;

  // If no set specified, sync all supported sets
  const setsToSync = setCode
    ? SUPPORTED_SETS.filter((s) => s.code === setCode)
    : SUPPORTED_SETS;

  if (setsToSync.length === 0) {
    return NextResponse.json(
      { error: `Invalid set code: ${setCode}` },
      { status: 400 }
    );
  }

  const results: Array<{
    setCode: string;
    status: string;
    cardsAdded: number;
    cardsUpdated: number;
    error?: string;
  }> = [];

  for (const set of setsToSync) {
    const logEntry = await prisma.dataSyncLog.create({
      data: {
        setCode: set.code,
        format,
        status: "started",
      },
    });

    try {
      // Ensure set metadata exists
      await prisma.setMetadata.upsert({
        where: { setCode: set.code },
        create: {
          setCode: set.code,
          setName: set.name,
          releaseDate: new Date(set.releaseDate),
          syncStatus: "syncing",
        },
        update: {
          syncStatus: "syncing",
        },
      });

      // Fetch data from both sources
      console.log(`Fetching 17lands data for ${set.code} (${set.dataStartDate} to ${set.dataEndDate})...`);
      const ratingsData = await fetchCardRatings(set.code, "PremierDraft", set.dataStartDate, set.dataEndDate);

      console.log(`Fetching Scryfall data for ${set.code}...`);
      const scryfallCards = await fetchSetCards(set.code);

      // Create a map of card names to 17lands data
      const ratingsMap = new Map(ratingsData.map((c) => [c.name, c]));

      let cardsAdded = 0;
      let cardsUpdated = 0;

      // Process each Scryfall card
      for (const sfCard of scryfallCards) {
        const ratings = ratingsMap.get(sfCard.name);

        // Get IWD if ratings exist
        const iih = ratings ? getIwd(ratings) : null;

        // Prepare card data
        const cardData = {
          name: sfCard.name,
          setCode: set.code,
          collectorNumber: sfCard.collector_number,
          colors: JSON.stringify(sfCard.colors || []),
          colorIdentity: JSON.stringify(sfCard.color_identity || []),
          rarity: sfCard.rarity,
          typeLine: sfCard.type_line,
          manaCost: sfCard.mana_cost || null,
          scryfallId: sfCard.id,
          imageUri: getCardImageUri(sfCard, "normal"),
          imageUriLarge: getCardImageUri(sfCard, "large"),
          isBasicLand: isBasicLand(sfCard),
          isSpecialGuest: isSpecialGuest(sfCard),
          gamesPlayed: ratings?.ever_drawn_game_count || 0,
          lastSyncedAt: new Date(),
          iihPremier: iih,
          winRatePremier: ratings?.win_rate || null,
          gihWrPremier: ratings?.opening_hand_win_rate || null,
        };

        // Upsert the card
        const existing = await prisma.card.findUnique({
          where: {
            setCode_collectorNumber: {
              setCode: set.code,
              collectorNumber: sfCard.collector_number,
            },
          },
        });

        if (existing) {
          await prisma.card.update({
            where: { id: existing.id },
            data: cardData,
          });
          cardsUpdated++;
        } else {
          await prisma.card.create({
            data: cardData,
          });
          cardsAdded++;
        }
      }

      // Update set metadata
      await prisma.setMetadata.update({
        where: { setCode: set.code },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: "complete",
          cardCount: cardsAdded + cardsUpdated,
        },
      });

      // Update sync log
      await prisma.dataSyncLog.update({
        where: { id: logEntry.id },
        data: {
          status: "completed",
          cardsAdded,
          cardsUpdated,
          completedAt: new Date(),
        },
      });

      results.push({
        setCode: set.code,
        status: "success",
        cardsAdded,
        cardsUpdated,
      });

      console.log(
        `Synced ${set.code}: ${cardsAdded} added, ${cardsUpdated} updated`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await prisma.dataSyncLog.update({
        where: { id: logEntry.id },
        data: {
          status: "failed",
          errorMessage,
          completedAt: new Date(),
        },
      });

      await prisma.setMetadata.update({
        where: { setCode: set.code },
        data: { syncStatus: "error" },
      });

      results.push({
        setCode: set.code,
        status: "error",
        cardsAdded: 0,
        cardsUpdated: 0,
        error: errorMessage,
      });

      console.error(`Error syncing ${set.code}:`, error);
    }
  }

  return NextResponse.json({ results });
}

export async function GET() {
  // Return sync status for all sets
  const sets = await prisma.setMetadata.findMany({
    orderBy: { releaseDate: "desc" },
  });

  return NextResponse.json({ sets });
}
