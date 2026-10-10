import { describe, expect, it } from "vitest";
import { parseRatingInput } from "./validate";

describe("parseRatingInput", () => {
  it("accepts a valid rating and dedupes tags", () => {
    const res = parseRatingInput({ fun: 8, experience: "some", tags: ["fast", "fast", "skill"] });
    expect(res).toEqual({ ok: true, value: { fun: 8, experience: "some", tags: ["fast", "skill"] } });
  });

  it("defaults tags to empty", () => {
    const res = parseRatingInput({ fun: 1, experience: "few" });
    expect(res.ok && res.value.tags).toEqual([]);
  });

  it.each([
    [{ fun: 0, experience: "few" }],
    [{ fun: 11, experience: "few" }],
    [{ fun: 7.5, experience: "few" }],
    [{ fun: "7", experience: "few" }],
    [{ fun: 7, experience: "expert" }],
    [{ fun: 7, experience: "few", tags: ["boring"] }],
    [{ fun: 7, experience: "few", tags: "fast" }],
    [null],
  ])("rejects %j", (body) => {
    expect(parseRatingInput(body).ok).toBe(false);
  });
});
