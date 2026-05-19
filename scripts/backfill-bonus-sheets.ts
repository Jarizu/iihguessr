/**
 * One-time backfill: find every Scryfall set with `parent_set_code` matching
 * a set we already track in SetMetadata, and sync the bonus sheet so its
 * cards become draftable inside the parent's game.
 *
 * Usage: CRON_SECRET=... DATABASE_URL=... npx tsx scripts/backfill-bonus-sheets.ts
 */
import { PrismaClient } from "@prisma/client";
import { fetchAllSets } from "../src/lib/api/scryfall-sets";
import { syncSet } from "../src/lib/sync/sync-set";
import { getOverrideParent } from "../src/lib/utils/bonus-sheets";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.setMetadata.findMany({
    select: { setCode: true },
  });
  const known = new Set(existing.map((s) => s.setCode));

  const allSets = await fetchAllSets();
  const bonusSheets = allSets.filter((s) => {
    const code = s.code.toLowerCase();
    if (known.has(code)) return false;
    const parent =
      s.parent_set_code?.toLowerCase() || getOverrideParent(s.code);
    return !!parent && known.has(parent);
  });

  console.log(`Found ${bonusSheets.length} bonus sheets to backfill.`);

  for (const bs of bonusSheets) {
    const code = bs.code.toLowerCase();
    const parent =
      bs.parent_set_code?.toLowerCase() || getOverrideParent(bs.code)!;
    console.log(`Backfilling ${code} (parent ${parent})...`);

    await prisma.setMetadata.upsert({
      where: { setCode: code },
      create: {
        setCode: code,
        setName: bs.name,
        releaseDate: new Date(bs.released_at),
        parentSetCode: parent,
        isSupported: false,
        syncStatus: "pending",
      },
      update: { parentSetCode: parent, isSupported: false },
    });

    const result = await syncSet(code);
    console.log(`  → ${result.status}: ${result.cardsAdded} added, ${result.cardsUpdated} updated`);
    if (result.error) console.warn(`  ! ${result.error}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
