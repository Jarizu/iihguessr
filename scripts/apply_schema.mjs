/**
 * One-shot schema migration via Neon's HTTP driver (works in sandboxed envs
 * that block TCP 5432). Idempotent: every statement uses IF NOT EXISTS or
 * checks before mutating.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf8");
const url = envFile.match(/^DATABASE_URL_UNPOOLED="(.+)"$/m)?.[1]
  ?? envFile.match(/^DATABASE_URL="(.+)"$/m)[1];
const sql = neon(url);

console.log("Applying schema changes...");

// 1) Card.alsaPremier
await sql`ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "alsaPremier" DOUBLE PRECISION`;
console.log("  ✓ Card.alsaPremier");

// 2) SetMetadata.parentSetCode + index
await sql`ALTER TABLE "SetMetadata" ADD COLUMN IF NOT EXISTS "parentSetCode" TEXT`;
await sql`CREATE INDEX IF NOT EXISTS "SetMetadata_parentSetCode_idx" ON "SetMetadata"("parentSetCode")`;
console.log("  ✓ SetMetadata.parentSetCode");

// 3) Guess.metric + index
await sql`ALTER TABLE "Guess" ADD COLUMN IF NOT EXISTS "metric" TEXT NOT NULL DEFAULT 'IIH'`;
await sql`CREATE INDEX IF NOT EXISTS "Guess_userId_metric_idx" ON "Guess"("userId", "metric")`;
console.log("  ✓ Guess.metric");

// 4) UserStats: metricBreakdown + biggestMissMetric
await sql`ALTER TABLE "UserStats" ADD COLUMN IF NOT EXISTS "metricBreakdown" TEXT NOT NULL DEFAULT '{}'`;
await sql`ALTER TABLE "UserStats" ADD COLUMN IF NOT EXISTS "biggestMissMetric" TEXT`;
console.log("  ✓ UserStats.metricBreakdown / biggestMissMetric");

// 5) Backfill biggestMissMetric for existing rows
const updated = await sql`UPDATE "UserStats" SET "biggestMissMetric" = 'IIH' WHERE "biggestMissId" IS NOT NULL AND "biggestMissMetric" IS NULL`;
console.log(`  ✓ Backfilled biggestMissMetric on ${updated.length ?? "?"} row(s)`);

// 6) Verify columns are present
const cardCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'Card' AND column_name IN ('iihPremier', 'gihWrPremier', 'alsaPremier')`;
const guessCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'Guess' AND column_name IN ('metric', 'cardAIih', 'cardBIih', 'iihDifference')`;
const setCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'SetMetadata' AND column_name IN ('parentSetCode')`;

console.log("\nFinal column verification:");
console.log("  Card cols:", cardCols.map(c => c.column_name).sort().join(", "));
console.log("  Guess cols:", guessCols.map(c => c.column_name).sort().join(", "));
console.log("  SetMetadata extra cols:", setCols.map(c => c.column_name).sort().join(", "));

console.log("\nSchema migration complete.");
