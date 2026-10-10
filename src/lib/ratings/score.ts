import {
  EXPERIENCED_LEVELS,
  MIN_RATINGS_TO_RANK,
  PRIOR_WEIGHT,
  RATER_SHRINK,
  TAG_SHARE_THRESHOLD,
  type Experience,
} from "./constants";

export interface RatingRow {
  userId: string;
  setCode: string;
  fun: number;
  experience: string;
  tags: string[];
}

export interface SetScore {
  setCode: string;
  count: number;
  /** Plain average of the raw scores. */
  rawMean: number;
  /** Rater-adjusted, shrunk toward the site mean. What the ranking uses. */
  score: number;
  ranked: boolean;
  /** Tags picked by at least TAG_SHARE_THRESHOLD of raters, most common first. */
  tags: { tag: string; share: number }[];
}

export interface ScoreOptions {
  experiencedOnly?: boolean;
}

/**
 * Turn raw ratings into per-set scores. Ratings are stored raw and scored on
 * every read, so this formula can change without touching stored data.
 *
 * 1. Rater correction: each rater gets an offset — how far above or below
 *    the site mean they rate, shrunk by RATER_SHRINK so a single rating
 *    barely counts. Their ratings are adjusted by subtracting it.
 * 2. Small-sample shrinkage: each set's mean adjusted rating is blended with
 *    the site mean as if it had PRIOR_WEIGHT extra average votes.
 */
export function computeSetScores(
  rows: RatingRow[],
  options: ScoreOptions = {},
): { globalMean: number; sets: Map<string, SetScore> } {
  const sample = options.experiencedOnly
    ? rows.filter((r) =>
        EXPERIENCED_LEVELS.includes(r.experience as Experience),
      )
    : rows;

  const sets = new Map<string, SetScore>();
  if (sample.length === 0) return { globalMean: 0, sets };

  const globalMean = sample.reduce((sum, r) => sum + r.fun, 0) / sample.length;

  const raterDeviation = new Map<string, { sum: number; n: number }>();
  for (const r of sample) {
    const d = raterDeviation.get(r.userId) ?? { sum: 0, n: 0 };
    d.sum += r.fun - globalMean;
    d.n += 1;
    raterDeviation.set(r.userId, d);
  }
  const raterOffset = (userId: string) => {
    const d = raterDeviation.get(userId)!;
    return d.sum / (d.n + RATER_SHRINK);
  };

  const bySet = new Map<string, RatingRow[]>();
  for (const r of sample) {
    const list = bySet.get(r.setCode) ?? [];
    list.push(r);
    bySet.set(r.setCode, list);
  }

  for (const [setCode, list] of bySet) {
    const count = list.length;
    const rawMean = list.reduce((sum, r) => sum + r.fun, 0) / count;
    const adjustedSum = list.reduce(
      (sum, r) => sum + (r.fun - raterOffset(r.userId)),
      0,
    );
    const score =
      (adjustedSum + PRIOR_WEIGHT * globalMean) / (count + PRIOR_WEIGHT);

    const tagCounts = new Map<string, number>();
    for (const r of list) {
      for (const t of new Set(r.tags)) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    const tags = [...tagCounts]
      .map(([tag, n]) => ({ tag, share: n / count }))
      .filter((t) => t.share >= TAG_SHARE_THRESHOLD)
      .sort((a, b) => b.share - a.share);

    sets.set(setCode, {
      setCode,
      count,
      rawMean,
      score,
      ranked: count >= MIN_RATINGS_TO_RANK,
      tags,
    });
  }

  return { globalMean, sets };
}
