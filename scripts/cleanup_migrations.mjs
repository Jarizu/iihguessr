import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync("/home/user/iihguessr/.env.local", "utf8");
const url = envFile.match(/^DATABASE_URL_UNPOOLED="(.+)"$/m)?.[1]
  ?? envFile.match(/^DATABASE_URL="(.+)"$/m)[1];
const sql = neon(url);

// Mark the orphan failed migration as rolled back so future `prisma migrate
// deploy` calls (if anyone tries) don't blow up. We're not actually using
// migrate deploy — the project's convention is db push — but no reason to
// leave broken state lying around.
const result = await sql`UPDATE _prisma_migrations
  SET rolled_back_at = NOW()
  WHERE migration_name = '20260205201620_add_org_api_key'
    AND finished_at IS NULL
    AND rolled_back_at IS NULL`;

console.log(`Marked orphan migration as rolled back.`);

// Show final state
const rows = await sql`SELECT migration_name, started_at, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at DESC`;
for (const r of rows) {
  const status = r.rolled_back_at ? "rolled-back" : r.finished_at ? "applied" : "in-progress";
  console.log(`  ${status.padEnd(13)} ${r.migration_name}`);
}
