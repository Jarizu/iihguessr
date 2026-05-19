/**
 * Seeds the SetMetadata table from a static list. Run once after deploy.
 * After the initial seed, /api/sync/discover handles new sets daily.
 *
 * Usage: npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedSet {
  code: string;
  name: string;
  releaseDate: string;
  parentSetCode?: string;
}

const SEED_SETS: SeedSet[] = [
  // 2026
  { code: "ecl", name: "Lorwyn Eclipsed", releaseDate: "2026-01-23" },
  // 2025
  { code: "tla", name: "Avatar: The Last Airbender", releaseDate: "2025-11-21" },
  { code: "eoe", name: "Edge of Eternities", releaseDate: "2025-08-01" },
  { code: "fin", name: "Final Fantasy", releaseDate: "2025-06-13" },
  { code: "tdm", name: "Tarkir: Dragonstorm", releaseDate: "2025-04-11" },
  { code: "dft", name: "Aetherdrift", releaseDate: "2025-02-14" },
  // 2024
  { code: "fdn", name: "Foundations", releaseDate: "2024-11-15" },
  { code: "dsk", name: "Duskmourn: House of Horror", releaseDate: "2024-09-27" },
  { code: "blb", name: "Bloomburrow", releaseDate: "2024-08-02" },
  { code: "otj", name: "Outlaws of Thunder Junction", releaseDate: "2024-04-19" },
  { code: "mkm", name: "Murders at Karlov Manor", releaseDate: "2024-02-09" },
  // 2023
  { code: "lci", name: "Lost Caverns of Ixalan", releaseDate: "2023-11-14" },
  { code: "woe", name: "Wilds of Eldraine", releaseDate: "2023-09-08" },
  { code: "ltr", name: "The Lord of the Rings: Tales of Middle-earth", releaseDate: "2023-06-23" },
  { code: "mat", name: "March of the Machine: The Aftermath", releaseDate: "2023-05-12" },
  { code: "mom", name: "March of the Machine", releaseDate: "2023-04-21" },
  { code: "one", name: "Phyrexia: All Will Be One", releaseDate: "2023-02-10" },
  // 2022
  { code: "bro", name: "The Brothers' War", releaseDate: "2022-11-18" },
  { code: "dmu", name: "Dominaria United", releaseDate: "2022-09-09" },
  { code: "snc", name: "Streets of New Capenna", releaseDate: "2022-04-29" },
  { code: "neo", name: "Kamigawa: Neon Dynasty", releaseDate: "2022-02-18" },
  // 2021
  { code: "vow", name: "Innistrad: Crimson Vow", releaseDate: "2021-11-19" },
  { code: "mid", name: "Innistrad: Midnight Hunt", releaseDate: "2021-09-24" },
  { code: "afr", name: "Adventures in the Forgotten Realms", releaseDate: "2021-07-23" },
  { code: "stx", name: "Strixhaven: School of Mages", releaseDate: "2021-04-23" },
  { code: "khm", name: "Kaldheim", releaseDate: "2021-02-05" },
  // 2020
  { code: "znr", name: "Zendikar Rising", releaseDate: "2020-09-25" },
  { code: "iko", name: "Ikoria: Lair of Behemoths", releaseDate: "2020-04-24" },
  { code: "thb", name: "Theros Beyond Death", releaseDate: "2020-01-24" },
  // 2019
  { code: "eld", name: "Throne of Eldraine", releaseDate: "2019-10-04" },
  { code: "m20", name: "Core Set 2020", releaseDate: "2019-07-12" },
  { code: "war", name: "War of the Spark", releaseDate: "2019-05-03" },
  { code: "rna", name: "Ravnica Allegiance", releaseDate: "2019-01-25" },
  // 2018
  { code: "grn", name: "Guilds of Ravnica", releaseDate: "2018-10-05" },
  { code: "dom", name: "Dominaria", releaseDate: "2018-04-27" },
];

async function main() {
  for (const s of SEED_SETS) {
    await prisma.setMetadata.upsert({
      where: { setCode: s.code },
      create: {
        setCode: s.code,
        setName: s.name,
        releaseDate: new Date(s.releaseDate),
        parentSetCode: s.parentSetCode ?? null,
        isSupported: !s.parentSetCode,
        syncStatus: "pending",
      },
      update: {
        // Don't clobber sync state on re-runs; only fill in newly added fields.
        setName: s.name,
        parentSetCode: s.parentSetCode ?? null,
      },
    });
  }
  console.log(`Seeded ${SEED_SETS.length} sets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
