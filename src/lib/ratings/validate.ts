import {
  EXPERIENCE_LEVELS,
  FUN_MAX,
  FUN_MIN,
  RATING_TAGS,
  type Experience,
  type RatingTag,
} from "./constants";

export interface RatingInput {
  fun: number;
  experience: Experience;
  tags: RatingTag[];
}

const EXPERIENCE_VALUES = new Set<string>(EXPERIENCE_LEVELS.map((e) => e.value));
const TAG_VALUES = new Set<string>(RATING_TAGS.map((t) => t.value));

export function parseRatingInput(
  body: unknown,
): { ok: true; value: RatingInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected a JSON object" };
  }
  const { fun, experience, tags = [] } = body as Record<string, unknown>;

  if (
    typeof fun !== "number" ||
    !Number.isInteger(fun) ||
    fun < FUN_MIN ||
    fun > FUN_MAX
  ) {
    return { ok: false, error: `fun must be an integer from ${FUN_MIN} to ${FUN_MAX}` };
  }
  if (typeof experience !== "string" || !EXPERIENCE_VALUES.has(experience)) {
    return { ok: false, error: "experience must be one of few, some, lots" };
  }
  if (
    !Array.isArray(tags) ||
    !tags.every((t) => typeof t === "string" && TAG_VALUES.has(t))
  ) {
    return { ok: false, error: "tags contains an unknown tag" };
  }

  return {
    ok: true,
    value: {
      fun,
      experience: experience as Experience,
      tags: [...new Set(tags as RatingTag[])],
    },
  };
}
