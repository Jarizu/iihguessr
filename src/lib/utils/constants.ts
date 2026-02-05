import { SupportedSet, DraftFormat } from "@/types";

export const SUPPORTED_SETS: SupportedSet[] = [
  // 2026 Sets
  { code: "LWE", name: "Lorwyn Eclipse", releaseDate: "2026-01-17", dataStartDate: "2026-01-10", dataEndDate: "2026-04-01" },

  // 2025 Sets
  { code: "TBD", name: "Tarkir: Dragonstorm", releaseDate: "2025-11-07", dataStartDate: "2025-10-31", dataEndDate: "2026-01-17" },
  { code: "DFT", name: "Duskmourn: Fractures", releaseDate: "2025-06-20", dataStartDate: "2025-06-13", dataEndDate: "2025-11-07" },
  { code: "AKR", name: "Amonkhet Remastered", releaseDate: "2025-04-25", dataStartDate: "2025-04-18", dataEndDate: "2025-06-20" },
  { code: "AET", name: "Aetherdrift", releaseDate: "2025-02-14", dataStartDate: "2025-02-07", dataEndDate: "2025-04-25" },

  // 2024 Sets
  { code: "FDN", name: "Foundations", releaseDate: "2024-11-15", dataStartDate: "2024-11-08", dataEndDate: "2025-02-14" },
  { code: "DSK", name: "Duskmourn: House of Horror", releaseDate: "2024-09-27", dataStartDate: "2024-09-20", dataEndDate: "2024-11-15" },
  { code: "BLB", name: "Bloomburrow", releaseDate: "2024-08-02", dataStartDate: "2024-07-30", dataEndDate: "2024-09-27" },
  { code: "OTJ", name: "Outlaws of Thunder Junction", releaseDate: "2024-04-19", dataStartDate: "2024-04-12", dataEndDate: "2024-08-02" },
  { code: "MKM", name: "Murders at Karlov Manor", releaseDate: "2024-02-09", dataStartDate: "2024-02-02", dataEndDate: "2024-04-19" },

  // 2023 Sets
  { code: "LCI", name: "Lost Caverns of Ixalan", releaseDate: "2023-11-14", dataStartDate: "2023-11-07", dataEndDate: "2024-02-09" },
  { code: "WOE", name: "Wilds of Eldraine", releaseDate: "2023-09-08", dataStartDate: "2023-09-01", dataEndDate: "2023-11-14" },
  { code: "LTR", name: "The Lord of the Rings: Tales of Middle-earth", releaseDate: "2023-06-23", dataStartDate: "2023-06-20", dataEndDate: "2023-09-08" },
  { code: "MOM", name: "March of the Machine", releaseDate: "2023-04-21", dataStartDate: "2023-04-18", dataEndDate: "2023-06-23" },
  { code: "MAT", name: "March of the Machine: The Aftermath", releaseDate: "2023-05-12", dataStartDate: "2023-05-09", dataEndDate: "2023-06-23" },
  { code: "ONE", name: "Phyrexia: All Will Be One", releaseDate: "2023-02-10", dataStartDate: "2023-02-07", dataEndDate: "2023-04-21" },

  // 2022 Sets
  { code: "BRO", name: "The Brothers' War", releaseDate: "2022-11-18", dataStartDate: "2022-11-15", dataEndDate: "2023-02-10" },
  { code: "DMU", name: "Dominaria United", releaseDate: "2022-09-09", dataStartDate: "2022-09-01", dataEndDate: "2022-11-18" },
  { code: "SNC", name: "Streets of New Capenna", releaseDate: "2022-04-29", dataStartDate: "2022-04-28", dataEndDate: "2022-09-09" },
  { code: "NEO", name: "Kamigawa: Neon Dynasty", releaseDate: "2022-02-18", dataStartDate: "2022-02-10", dataEndDate: "2022-04-29" },
  { code: "VOW", name: "Innistrad: Crimson Vow", releaseDate: "2021-11-19", dataStartDate: "2021-11-11", dataEndDate: "2022-02-18" },
  { code: "MID", name: "Innistrad: Midnight Hunt", releaseDate: "2021-09-24", dataStartDate: "2021-09-16", dataEndDate: "2021-11-19" },

  // 2021 Sets
  { code: "AFR", name: "Adventures in the Forgotten Realms", releaseDate: "2021-07-23", dataStartDate: "2021-07-08", dataEndDate: "2021-09-24" },
  { code: "STX", name: "Strixhaven: School of Mages", releaseDate: "2021-04-23", dataStartDate: "2021-04-15", dataEndDate: "2021-07-23" },
  { code: "KHM", name: "Kaldheim", releaseDate: "2021-02-05", dataStartDate: "2021-01-28", dataEndDate: "2021-04-23" },

  // 2020 Sets
  { code: "ZNR", name: "Zendikar Rising", releaseDate: "2020-09-25", dataStartDate: "2020-01-01", dataEndDate: "2025-12-31" },
  { code: "IKO", name: "Ikoria: Lair of Behemoths", releaseDate: "2020-04-24", dataStartDate: "2020-01-01", dataEndDate: "2025-12-31" },
  { code: "THB", name: "Theros Beyond Death", releaseDate: "2020-01-24", dataStartDate: "2020-01-01", dataEndDate: "2025-12-31" },

  // 2019 Sets
  { code: "ELD", name: "Throne of Eldraine", releaseDate: "2019-10-04", dataStartDate: "2019-01-01", dataEndDate: "2025-12-31" },
  { code: "M20", name: "Core Set 2020", releaseDate: "2019-07-12", dataStartDate: "2019-01-01", dataEndDate: "2025-12-31" },
  { code: "WAR", name: "War of the Spark", releaseDate: "2019-05-03", dataStartDate: "2019-01-01", dataEndDate: "2025-12-31" },
  { code: "RNA", name: "Ravnica Allegiance", releaseDate: "2019-01-25", dataStartDate: "2019-01-01", dataEndDate: "2025-12-31" },
  { code: "GRN", name: "Guilds of Ravnica", releaseDate: "2018-10-05", dataStartDate: "2018-01-01", dataEndDate: "2025-12-31" },

  // Historic Sets with Data
  { code: "DOM", name: "Dominaria", releaseDate: "2018-04-27", dataStartDate: "2018-01-01", dataEndDate: "2025-12-31" },
];

export const FORMATS: DraftFormat[] = ["PremierDraft"];

export const DEFAULT_SET = "LWE";
export const DEFAULT_FORMAT: DraftFormat = "PremierDraft";

export const PAIRING_CONFIG = {
  minIwdDifference: 0.01, // 1 percentage point
  maxIwdDifference: 0.05, // 5 percentage points
  colorAffinityWeight: 0.7, // 70% chance to match colors
  excludeBasicLands: true,
  excludeSpecialGuests: true,
};

export const PRELOAD_PAIR_COUNT = 3;

export const SEVENTEEN_LANDS_BASE_URL = "https://www.17lands.com";
export const SCRYFALL_BASE_URL = "https://api.scryfall.com";
