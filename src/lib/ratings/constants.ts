export const FUN_MIN = 1;
export const FUN_MAX = 10;

export const EXPERIENCE_LEVELS = [
  { value: "few", label: "1–5 drafts" },
  { value: "some", label: "6–20 drafts" },
  { value: "lots", label: "20+ drafts" },
] as const;
export type Experience = (typeof EXPERIENCE_LEVELS)[number]["value"];

/** Raters at these levels count as "experienced" for the filter. */
export const EXPERIENCED_LEVELS: readonly Experience[] = ["some", "lots"];

export const RATING_TAGS = [
  { value: "fast", label: "Fast" },
  { value: "slow", label: "Slow" },
  { value: "bomb-heavy", label: "Bomb-heavy" },
  { value: "synergy", label: "Synergy-driven" },
  { value: "skill", label: "Rewards skill" },
  { value: "swingy", label: "Swingy" },
  { value: "deep", label: "Deep archetypes" },
] as const;
export type RatingTag = (typeof RATING_TAGS)[number]["value"];

/** Sets with fewer ratings than this show "needs more ratings" instead of a rank. */
export const MIN_RATINGS_TO_RANK = 5;

/**
 * Each set's score is blended with the site-wide mean as if it had this many
 * extra average votes, so a set with three 10s doesn't top the list.
 */
export const PRIOR_WEIGHT = 10;

/**
 * How quickly a rater's harshness/generosity correction kicks in. A rater's
 * offset is (sum of their deviations from the site mean) / (n + this), so
 * one rating barely moves it and ten ratings mostly do.
 */
export const RATER_SHRINK = 3;

/** A tag is shown for a set when at least this share of its raters picked it. */
export const TAG_SHARE_THRESHOLD = 0.3;

/** Rounds played in one set (this visit) before the game asks for a rating. */
export const ROUNDS_BEFORE_PROMPT = 20;
