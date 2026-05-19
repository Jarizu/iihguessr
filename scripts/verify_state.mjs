import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf8");
const url = envFile.match(/^DATABASE_URL_UNPOOLED="(.+)"$/m)?.[1]
  ?? envFile.match(/^DATABASE_URL="(.+)"$/m)[1];
const sql = neon(url);

console.log("=== SetMetadata (bonus sheets only) ===");
const bonus = await sql`SELECT "setCode", "setName", "parentSetCode", "cardCount", "isSupported" FROM "SetMetadata" WHERE "parentSetCode" IS NOT NULL ORDER BY "parentSetCode", "setCode"`;
for (const r of bonus) {
  console.log(`  ${r.setCode.padEnd(6)} parent=${r.parentSetCode.padEnd(4)} cards=${String(r.cardCount).padStart(4)}  isSupported=${r.isSupported}  ${r.setName}`);
}

console.log("\n=== STX / SOA-style: Strixhaven family ===");
const stx = await sql`SELECT "setCode", "setName", "parentSetCode", "cardCount" FROM "SetMetadata" WHERE "setCode" IN ('stx', 'sta', 'soa', 'sos') OR "parentSetCode" IN ('stx', 'sos') ORDER BY "setCode"`;
for (const r of stx) {
  console.log(`  ${r.setCode.padEnd(6)} parent=${(r.parentSetCode ?? '-').padEnd(4)} cards=${String(r.cardCount).padStart(4)}  ${r.setName}`);
}

console.log("\n=== ALSA backfill check ===");
const alsa = await sql`SELECT "setCode", COUNT(*) AS total, COUNT("alsaPremier") AS with_alsa FROM "Card" WHERE "isBasicLand" = false GROUP BY "setCode" ORDER BY "setCode"`;
for (const r of alsa) {
  const pct = r.total > 0 ? Math.round((Number(r.with_alsa) / Number(r.total)) * 100) : 0;
  console.log(`  ${r.setCode.padEnd(6)} ${String(r.with_alsa).padStart(4)}/${String(r.total).padStart(4)}  (${pct}% with ALSA)`);
}
