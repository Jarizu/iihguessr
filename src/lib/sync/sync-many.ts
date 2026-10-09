import { syncSet, SyncResult } from "@/lib/sync/sync-set";
import type { DraftFormat } from "@/types";

/**
 * Vercel kills a function at its maxDuration (300s). Stop starting new sets
 * after this budget so the response always gets back with partial results
 * and the list of sets still to do.
 */
export const DEFAULT_SYNC_BUDGET_MS = 240_000;

export interface SyncManyResult {
  results: SyncResult[];
  /** Set codes not attempted because the time budget ran out. */
  remaining: string[];
}

export async function syncSetsWithinBudget(
  setCodes: string[],
  options: { format?: DraftFormat; budgetMs?: number; now?: () => number } = {},
): Promise<SyncManyResult> {
  const now = options.now ?? Date.now;
  const deadline = now() + (options.budgetMs ?? DEFAULT_SYNC_BUDGET_MS);
  const results: SyncResult[] = [];

  for (let i = 0; i < setCodes.length; i++) {
    if (now() >= deadline) {
      return { results, remaining: setCodes.slice(i) };
    }
    results.push(await syncSet(setCodes[i], { format: options.format }));
  }
  return { results, remaining: [] };
}
