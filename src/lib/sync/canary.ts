import { probeSetHasData } from "@/lib/api/17lands";
import { getOverrideParent } from "@/lib/utils/bonus-sheets";
import type { ScryfallSet } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Check that 17lands still returns data for the newest main set released at
 * least a week ago. 17lands only serves the current set publicly, so that's
 * the one set that should always have data. If it comes back empty, 17lands
 * has changed its API and every "no data yet" answer is a lie, so the cron
 * should fail loudly instead of silently skipping new sets.
 *
 * Returns null when healthy (or when there's no set to check), otherwise an
 * error message.
 */
export async function checkSeventeenLandsCanary(
  candidates: ScryfallSet[],
  now: Date = new Date(),
): Promise<string | null> {
  const cutoff = now.getTime() - 7 * DAY_MS;
  const canary = candidates
    .filter(
      (s) =>
        (s.set_type === "expansion" || s.set_type === "core") &&
        !s.parent_set_code &&
        !getOverrideParent(s.code) &&
        new Date(s.released_at).getTime() <= cutoff,
    )
    .sort((a, b) => b.released_at.localeCompare(a.released_at))[0];
  if (!canary) return null;

  const start = new Date(new Date(canary.released_at).getTime() - 7 * DAY_MS);
  const end = new Date(now.getTime() + DAY_MS);
  const ok = await probeSetHasData(
    canary.code.toLowerCase(),
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  );
  return ok
    ? null
    : `17lands returned no data for the current set ${canary.code}; its API may have changed`;
}
