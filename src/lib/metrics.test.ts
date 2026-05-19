import { describe, it, expect } from "vitest";
import {
  METRIC_CONFIG,
  correctCardId,
  isMetric,
  parseMetric,
  metricInstruction,
} from "./metrics";

describe("metrics", () => {
  describe("METRIC_CONFIG", () => {
    it("treats IIH and GIH WR as higher-is-better", () => {
      expect(METRIC_CONFIG.IIH.higherIsBetter).toBe(true);
      expect(METRIC_CONFIG.GIH_WR.higherIsBetter).toBe(true);
    });

    it("treats ALSA as lower-is-better", () => {
      expect(METRIC_CONFIG.ALSA.higherIsBetter).toBe(false);
    });

    it("maps each metric to its Card column", () => {
      expect(METRIC_CONFIG.IIH.column).toBe("iihPremier");
      expect(METRIC_CONFIG.GIH_WR.column).toBe("gihWrPremier");
      expect(METRIC_CONFIG.ALSA.column).toBe("alsaPremier");
    });

    it("formats values appropriately per metric", () => {
      expect(METRIC_CONFIG.IIH.format(0.0234)).toBe("2.3pp");
      expect(METRIC_CONFIG.GIH_WR.format(0.573)).toBe("57.3%");
      expect(METRIC_CONFIG.ALSA.format(4.23)).toBe("4.23");
    });
  });

  describe("correctCardId", () => {
    it("picks the higher value for IIH", () => {
      expect(correctCardId("IIH", "a", 0.04, "b", 0.02)).toBe("a");
      expect(correctCardId("IIH", "a", 0.01, "b", 0.03)).toBe("b");
    });

    it("picks the higher value for GIH WR", () => {
      expect(correctCardId("GIH_WR", "a", 0.58, "b", 0.55)).toBe("a");
      expect(correctCardId("GIH_WR", "a", 0.50, "b", 0.56)).toBe("b");
    });

    it("picks the lower value for ALSA (earlier pick = better)", () => {
      expect(correctCardId("ALSA", "a", 2.1, "b", 4.5)).toBe("a");
      expect(correctCardId("ALSA", "a", 8.0, "b", 3.2)).toBe("b");
    });

    it("breaks ties in favor of A", () => {
      expect(correctCardId("IIH", "a", 0.03, "b", 0.03)).toBe("a");
      expect(correctCardId("ALSA", "a", 5.0, "b", 5.0)).toBe("a");
    });
  });

  describe("isMetric / parseMetric", () => {
    it("recognizes valid metrics", () => {
      expect(isMetric("IIH")).toBe(true);
      expect(isMetric("GIH_WR")).toBe(true);
      expect(isMetric("ALSA")).toBe(true);
    });

    it("rejects garbage", () => {
      expect(isMetric("nope")).toBe(false);
      expect(isMetric(null)).toBe(false);
      expect(isMetric(undefined)).toBe(false);
      expect(isMetric(42)).toBe(false);
    });

    it("parseMetric falls back to default", () => {
      expect(parseMetric("ALSA")).toBe("ALSA");
      expect(parseMetric("nope")).toBe("IIH");
      expect(parseMetric(undefined)).toBe("IIH");
    });
  });

  describe("metricInstruction", () => {
    it("says higher for IIH and GIH WR", () => {
      expect(metricInstruction("IIH")).toContain("higher IIH");
      expect(metricInstruction("GIH_WR")).toContain("higher GIH WR");
    });

    it("says lower for ALSA", () => {
      expect(metricInstruction("ALSA")).toContain("lower ALSA");
    });
  });
});
