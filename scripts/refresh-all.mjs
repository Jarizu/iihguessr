/**
 * Re-sync every set's card data from 17lands, one set per request so each
 * call stays inside Vercel's function time limit.
 *
 * Usage: CRON_SECRET=... node scripts/refresh-all.mjs [https://iihguessr.com]
 */
const base = process.argv[2] ?? "https://iihguessr.com";
const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error("CRON_SECRET is required");
  process.exit(1);
}

const listRes = await fetch(`${base}/api/sync`);
if (!listRes.ok) {
  console.error(`Listing sets failed: ${listRes.status}`);
  process.exit(1);
}
const { sets } = await listRes.json();
console.log(`Refreshing ${sets.length} sets from ${base}`);

let failures = 0;
for (const { setCode } of sets) {
  const res = await fetch(`${base}/api/sync?set=${setCode}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json().catch(() => ({}));
  const result = body.results?.[0];
  if (!res.ok || !result || result.status !== "success") {
    failures++;
    console.log(`✗ ${setCode}: ${result?.error ?? body.error ?? res.status}`);
  } else {
    console.log(
      `✓ ${setCode}: ${result.cardsAdded} added, ${result.cardsUpdated} updated`,
    );
  }
}

console.log(`Done. ${sets.length - failures} ok, ${failures} failed.`);
process.exit(failures ? 1 : 0);
