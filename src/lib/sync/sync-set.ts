import { prisma } from "@/lib/prisma";
import {
  fetchCardRatings,
  getIwd,
} from "@/lib/api/17lands";
import {
  fetchSetCards,
  getCardImageUri,
  isBasicLand,
  isSpecialGuest,
} from "@/lib/api/scryfall";
import type { SeventeenLandsCard, ScryfallCard, DraftFormat } from "@/types";

export interface SyncResult {
  setCode: string;
  status: "success" | "error";
  cardsAdded: number;
  cardsUpdated: number;
  error?: string;
}

interface SyncOptions {
  format?: DraftFormat;
  /**
   * Override the start/end date for 17lands. Otherwise read from SetMetadata
   * or fall back to a rolling window around the set's release date.
   */
  startDate?: string;
  endDate?: string;
}

function rollingWindow(releaseDate: Date): { start: string; end: string } {
  const start = new Date(releaseDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  // 60 days past today (or 60 days past release for old sets) — wide enough
  // to capture any active queue. 17lands caps responses to data it has.
  const horizon = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const end = horizon > releaseDate ? horizon : new Date(releaseDate.getTime() + 60 * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/**
 * Sync one set: pull Scryfall cards + 17lands ratings, upsert rows in `Card`.
 * Bonus-sheet aware: if the set has a parent and 17lands returns nothing for
 * the child's own expansion code, falls back to fetching the parent's data
 * and matching by name against the child's Scryfall card pool.
 */
export async function syncSet(
  setCode: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const format: DraftFormat = options.format ?? "PremierDraft";

  const setMeta = await prisma.setMetadata.findUnique({
    where: { setCode },
  });
  if (!setMeta) {
    return {
      setCode,
      status: "error",
      cardsAdded: 0,
      cardsUpdated: 0,
      error: `No SetMetadata for ${setCode}; create the row before syncing`,
    };
  }

  const window = rollingWindow(setMeta.releaseDate);
  const startDate = options.startDate ?? window.start;
  const endDate = options.endDate ?? window.end;

  const logEntry = await prisma.dataSyncLog.create({
    data: { setCode, format, status: "started" },
  });

  try {
    await prisma.setMetadata.update({
      where: { setCode },
      data: { syncStatus: "syncing" },
    });

    // 17lands: try the set's own expansion first.
    let ratingsData = await fetchCardRatings(setCode, format, startDate, endDate);

    // Bonus-sheet fallback: if this set has a parent and we got nothing,
    // pull the parent's data and let the name-match step pick out the
    // cards we care about.
    if (ratingsData.length === 0 && setMeta.parentSetCode) {
      console.log(
        `[syncSet] No data for ${setCode}; falling back to parent ${setMeta.parentSetCode}`,
      );
      ratingsData = await fetchCardRatings(
        setMeta.parentSetCode,
        format,
        startDate,
        endDate,
      );
    }

    const scryfallCards = await fetchSetCards(setCode);

    const { cardsAdded, cardsUpdated } = await upsertCardsFromSources({
      setCode,
      scryfallCards,
      ratingsData,
    });

    await prisma.setMetadata.update({
      where: { setCode },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: "complete",
        cardCount: cardsAdded + cardsUpdated,
      },
    });
    await prisma.dataSyncLog.update({
      where: { id: logEntry.id },
      data: {
        status: "completed",
        cardsAdded,
        cardsUpdated,
        completedAt: new Date(),
      },
    });

    return { setCode, status: "success", cardsAdded, cardsUpdated };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await prisma.dataSyncLog.update({
      where: { id: logEntry.id },
      data: {
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      },
    });
    await prisma.setMetadata.update({
      where: { setCode },
      data: { syncStatus: "error" },
    });
    return {
      setCode,
      status: "error",
      cardsAdded: 0,
      cardsUpdated: 0,
      error: errorMessage,
    };
  }
}

interface UpsertArgs {
  setCode: string;
  scryfallCards: ScryfallCard[];
  ratingsData: SeventeenLandsCard[];
}

/**
 * Exported for testability — pure(ish) data mapping then upserts. Joins
 * 17lands ratings to Scryfall cards by name within the scope of a single
 * Scryfall set, which avoids the cross-set name-collision bug (e.g., a card
 * with the same name reprinted in both STX and STA).
 */
export async function upsertCardsFromSources({
  setCode,
  scryfallCards,
  ratingsData,
}: UpsertArgs): Promise<{ cardsAdded: number; cardsUpdated: number }> {
  const ratingsByName = new Map(ratingsData.map((c) => [c.name, c]));

  let cardsAdded = 0;
  let cardsUpdated = 0;

  for (const sfCard of scryfallCards) {
    const ratings = ratingsByName.get(sfCard.name);
    const iih = ratings ? getIwd(ratings) : null;
    const alsa = ratings && ratings.ever_drawn_game_count >= 50
      ? ratings.avg_seen
      : null;
    const gihWr = ratings && ratings.ever_drawn_game_count >= 50
      ? ratings.ever_drawn_win_rate
      : null;
    const winRate = ratings && ratings.ever_drawn_game_count >= 50
      ? ratings.win_rate
      : null;

    const cardData = {
      name: sfCard.name,
      setCode,
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
      winRatePremier: winRate,
      gihWrPremier: gihWr,
      alsaPremier: alsa,
    };

    const existing = await prisma.card.findUnique({
      where: {
        setCode_collectorNumber: {
          setCode,
          collectorNumber: sfCard.collector_number,
        },
      },
    });

    if (existing) {
      await prisma.card.update({ where: { id: existing.id }, data: cardData });
      cardsUpdated++;
    } else {
      await prisma.card.create({ data: cardData });
      cardsAdded++;
    }
  }

  return { cardsAdded, cardsUpdated };
}
