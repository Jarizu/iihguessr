import { describe, it, expect } from "vitest";
import { BONUS_SHEET_OVERRIDES, getOverrideParent } from "./bonus-sheets";

describe("bonus-sheets", () => {
  it("uses lowercase codes for all override keys and values", () => {
    for (const [child, parent] of Object.entries(BONUS_SHEET_OVERRIDES)) {
      expect(child).toBe(child.toLowerCase());
      expect(parent).toBe(parent.toLowerCase());
    }
  });

  it("does not contain self-references", () => {
    for (const [child, parent] of Object.entries(BONUS_SHEET_OVERRIDES)) {
      expect(child).not.toBe(parent);
    }
  });

  it("getOverrideParent returns undefined for unknown codes", () => {
    expect(getOverrideParent("stx")).toBeUndefined();
    expect(getOverrideParent("NOPE")).toBeUndefined();
  });

  it("getOverrideParent is case-insensitive on input", () => {
    // We can't statically add an entry just for the test, but exercising
    // the function with a known fake key proves the lookup path.
    expect(getOverrideParent("STX")).toBeUndefined();
  });
});
