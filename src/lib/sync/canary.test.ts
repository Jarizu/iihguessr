import { describe, expect, it, vi } from "vitest";

const { mockProbe } = vi.hoisted(() => ({ mockProbe: vi.fn() }));
vi.mock("@/lib/api/17lands", () => ({ probeSetHasData: mockProbe }));

import { checkSeventeenLandsCanary } from "./canary";
import type { ScryfallSet } from "@/types";

const set = (code: string, released_at: string, extra: Partial<ScryfallSet> = {}) =>
  ({ code, name: code, released_at, set_type: "expansion", digital: false, card_count: 250, ...extra }) as ScryfallSet;

describe("checkSeventeenLandsCanary", () => {
  const now = new Date("2026-10-09T04:00:00Z");
  const candidates = [
    set("msh", "2026-06-26"),
    set("fra", "2026-10-02"),
    set("trk", "2026-11-13"), // not released yet
    set("sds", "2026-10-03", { set_type: "masterpiece", parent_set_code: "fra" }),
  ];

  it("probes the newest main set released at least a week ago", async () => {
    mockProbe.mockResolvedValue(true);
    expect(await checkSeventeenLandsCanary(candidates, now)).toBeNull();
    expect(mockProbe).toHaveBeenCalledWith("fra", "2026-09-25", "2026-10-10");
  });

  it("reports an error when the current set has no data", async () => {
    mockProbe.mockResolvedValue(false);
    expect(await checkSeventeenLandsCanary(candidates, now)).toMatch(/fra/);
  });
});
