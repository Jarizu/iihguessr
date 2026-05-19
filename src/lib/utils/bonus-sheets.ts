/**
 * Manual overrides for parent/child set relationships that Scryfall does not
 * model with `parent_set_code`. Maps child set code -> parent set code.
 *
 * Most bonus sheets are already linked via `parent_set_code` (STA -> STX,
 * BRR -> BRO, MUL -> MOM, etc.) so this map should stay small.
 *
 * All codes lowercased.
 */
export const BONUS_SHEET_OVERRIDES: Record<string, string> = {
  // Example shape; add entries as needed:
  // "spg": "fdn",
};

/**
 * Get the parent set code for a given child set code, honoring the override
 * map. Returns undefined for sets without a parent.
 */
export function getOverrideParent(childCode: string): string | undefined {
  return BONUS_SHEET_OVERRIDES[childCode.toLowerCase()];
}
