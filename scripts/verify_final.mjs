import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf8");
const url = envFile.match(/^DATABASE_URL_UNPOOLED="(.+)"$/m)?.[1]
  ?? envFile.match(/^DATABASE_URL="(.+)"$/m)[1];
const sql = neon(url);

console.log("=== Bonus sheets — final ===");
const bonus = await sql`
  SELECT m."setCode", m."setName", m."parentSetCode",
    (SELECT COUNT(*) FROM "Card" WHERE "setCode" = m."setCode") AS card_count,
    (SELECT COUNT(*) FROM "Card" WHERE "setCode" = m."setCode" AND "iihPremier" IS NOT NULL) AS with_iih,
    (SELECT COUNT(*) FROM "Card" WHERE "setCode" = m."setCode" AND "alsaPremier" IS NOT NULL) AS with_alsa
  FROM "SetMetadata" m
  WHERE m."parentSetCode" IS NOT NULL
  ORDER BY m."parentSetCode", m."setCode"`;
for (const r of bonus) {
  console.log(`  ${r.setCode.padEnd(5)} → ${r.parentSetCode.padEnd(4)}  cards=${String(r.card_count).padStart(4)}  with_iih=${String(r.with_iih).padStart(3)}  with_alsa=${String(r.with_alsa).padStart(3)}  ${r.setName}`);
}

console.log("\n=== STX pool (what /api/cards/pair would query for setCode=stx) ===");
const stxPool = await sql`
  SELECT "setCode", COUNT(*) AS total,
    COUNT("iihPremier") AS iih,
    COUNT("gihWrPremier") AS gihwr,
    COUNT("alsaPremier") AS alsa
  FROM "Card"
  WHERE "setCode" IN ('stx', 'sta')
    AND "isBasicLand" = false
    AND "isSpecialGuest" = false
  GROUP BY "setCode"`;
for (const r of stxPool) {
  console.log(`  ${r.setCode}: total=${r.total}  iih=${r.iih}  gihwr=${r.gihwr}  alsa=${r.alsa}`);
}

console.log("\n=== Sample STA cards with metrics ===");
const sample = await sql`
  SELECT name, "iihPremier", "gihWrPremier", "alsaPremier", "gamesPlayed"
  FROM "Card"
  WHERE "setCode" = 'sta' AND "iihPremier" IS NOT NULL
  ORDER BY "iihPremier" DESC LIMIT 5`;
for (const c of sample) {
  console.log(`  ${c.name.padEnd(30)} IIH=${(c.iihPremier*100).toFixed(2).padStart(6)}pp  GIHWR=${(c.gihWrPremier*100).toFixed(2).padStart(6)}%  ALSA=${c.alsaPremier?.toFixed(2)}  games=${c.gamesPlayed}`);
}
