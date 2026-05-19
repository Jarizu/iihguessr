import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync("/home/user/iihguessr/.env.local", "utf8");
const url = envFile.match(/^DATABASE_URL="(.+)"$/m)[1];
const sql = neon(url);

console.log("=== Recent _prisma_migrations rows ===");
const rows = await sql`SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count, logs FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10`;
for (const r of rows) {
  const status = r.rolled_back_at ? "ROLLED BACK" : r.finished_at ? "applied" : "FAILED";
  console.log(`${status.padEnd(12)} ${r.migration_name}  started=${r.started_at?.toISOString?.() ?? r.started_at}`);
  if (status === "FAILED" && r.logs) console.log(`  logs: ${r.logs.slice(0, 300)}`);
}
