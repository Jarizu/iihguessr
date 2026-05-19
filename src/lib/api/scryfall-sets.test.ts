import { describe, it, expect, vi } from "vitest";
import { fetchAllSets, filterCandidateSets } from "./scryfall-sets";
import type { ScryfallSet } from "@/types";

const makeSet = (overrides: Partial<ScryfallSet> = {}): ScryfallSet => ({
  code: "xyz",
  name: "Test Set",
  released_at: "2024-01-01",
  set_type: "expansion",
  digital: false,
  card_count: 250,
  ...overrides,
});

describe("scryfall-sets", () => {
  describe("fetchAllSets", () => {
    it("parses the Scryfall /sets envelope and returns data array", async () => {
      const mockSets = [makeSet({ code: "abc" }), makeSet({ code: "def" })];
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ object: "list", has_more: false, data: mockSets }),
      } as Response);

      const result = await fetchAllSets(fetchMock as unknown as typeof fetch);
      expect(result).toEqual(mockSets);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("throws on non-ok response", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);
      await expect(
        fetchAllSets(fetchMock as unknown as typeof fetch),
      ).rejects.toThrow(/500/);
    });
  });

  describe("filterCandidateSets", () => {
    const minDate = new Date("2020-01-01");
    const now = new Date("2026-05-18");

    it("includes normal expansion sets in the date range", () => {
      const sets = [
        makeSet({ code: "stx", set_type: "expansion", released_at: "2021-04-23" }),
      ];
      expect(filterCandidateSets(sets, minDate, now)).toHaveLength(1);
    });

    it("excludes digital-only sets", () => {
      const sets = [
        makeSet({ code: "yhol", set_type: "expansion", digital: true }),
      ];
      expect(filterCandidateSets(sets, minDate, now)).toHaveLength(0);
    });

    it("excludes non-expansion-like set types", () => {
      const sets = [
        makeSet({ code: "foo", set_type: "promo" }),
        makeSet({ code: "bar", set_type: "token" }),
      ];
      expect(filterCandidateSets(sets, minDate, now)).toHaveLength(0);
    });

    it("includes draft_innovation and core sets", () => {
      const sets = [
        makeSet({ code: "stx", set_type: "draft_innovation", released_at: "2021-04-23" }),
        makeSet({ code: "m20", set_type: "core", released_at: "2019-07-12" }),
      ];
      // m20 is before minDate (2020-01-01), so only stx
      const result = filterCandidateSets(sets, minDate, now);
      expect(result.map((s) => s.code)).toEqual(["stx"]);
    });

    it("includes sets up to 7 days in the future (preview window)", () => {
      const sets = [
        makeSet({ code: "soon", released_at: "2026-05-20" }), // 2 days out
        makeSet({ code: "later", released_at: "2026-06-01" }), // ~2 weeks out
      ];
      const result = filterCandidateSets(sets, minDate, now);
      expect(result.map((s) => s.code)).toEqual(["soon"]);
    });

    it("excludes sets older than minReleaseDate", () => {
      const sets = [
        makeSet({ code: "old", released_at: "2018-04-27" }),
      ];
      expect(filterCandidateSets(sets, minDate, now)).toHaveLength(0);
    });

    it("includes bonus sheets (masterpiece type with parent_set_code)", () => {
      const sets = [
        makeSet({
          code: "sta",
          set_type: "masterpiece",
          parent_set_code: "stx",
          released_at: "2021-04-23",
        }),
      ];
      expect(filterCandidateSets(sets, minDate, now)).toHaveLength(1);
    });
  });
});
