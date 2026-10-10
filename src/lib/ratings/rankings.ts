import type { SetScore } from "./score";

export interface RankableSet {
  code: string;
  name: string;
  releaseDate: Date;
}

export interface SetRanking {
  code: string;
  name: string;
  releaseDate: string;
  count: number;
  /** null until the set has MIN_RATINGS_TO_RANK ratings. */
  score: number | null;
  rank: number | null;
  tags: { tag: string; share: number }[];
}

/**
 * Ranked sets first (by score), then sets that need more ratings (most
 * ratings first, then newest). Scores of unranked sets are withheld so a
 * couple of votes can't be read as a verdict.
 */
export function buildRankings(
  sets: RankableSet[],
  scores: Map<string, SetScore>,
): SetRanking[] {
  const rows = sets.map((s) => {
    const sc = scores.get(s.code);
    return {
      code: s.code,
      name: s.name,
      releaseDate: s.releaseDate.toISOString().slice(0, 10),
      count: sc?.count ?? 0,
      score: sc?.ranked ? Math.round(sc.score * 10) / 10 : null,
      rawScore: sc?.ranked ? sc.score : null,
      rank: null as number | null,
      tags: sc?.tags ?? [],
    };
  });

  const ranked = rows
    .filter((r) => r.rawScore !== null)
    .sort((a, b) => b.rawScore! - a.rawScore!);
  ranked.forEach((r, i) => (r.rank = i + 1));

  const unranked = rows
    .filter((r) => r.rawScore === null)
    .sort(
      (a, b) =>
        b.count - a.count || b.releaseDate.localeCompare(a.releaseDate),
    );

  return [...ranked, ...unranked].map(({ rawScore: _, ...r }) => r);
}
