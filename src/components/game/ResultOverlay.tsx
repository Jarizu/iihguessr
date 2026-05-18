"use client";

import { GuessResponse } from "@/types";
import { getScryfallCardUrl } from "@/lib/utils/17lands-urls";
import { METRIC_CONFIG, Metric } from "@/lib/metrics";

interface ResultOverlayProps {
  result: GuessResponse;
  onNext: () => void;
}

interface MetricRowProps {
  metric: Metric;
  active: boolean;
  valueA: number | null;
  valueB: number | null;
}

function MetricRow({ metric, active, valueA, valueB }: MetricRowProps) {
  const cfg = METRIC_CONFIG[metric];
  const fmt = (v: number | null) => (v === null ? "—" : cfg.format(v));
  return (
    <div
      className={`flex justify-between gap-4 text-xs ${
        active ? "text-white font-semibold" : "text-gray-500"
      }`}
    >
      <span className="w-16 text-left">{cfg.label}</span>
      <span className="flex-1 text-right">{fmt(valueA)}</span>
      <span className="text-gray-600">vs</span>
      <span className="flex-1 text-left">{fmt(valueB)}</span>
    </div>
  );
}

export function ResultOverlay({ result, onNext }: ResultOverlayProps) {
  const activeCfg = METRIC_CONFIG[result.metric];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3 md:p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto">
        {/* Result status and button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl ${
                result.isCorrect ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.isCorrect ? "✓" : "✗"}
            </span>
            <span
              className={`text-lg font-bold ${
                result.isCorrect ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.isCorrect ? "Correct!" : "Incorrect"}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              ({activeCfg.label}: Δ {activeCfg.formatDiff(result.valueDifference)})
            </span>
          </div>

          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Next →
          </button>
        </div>

        {/* Card names */}
        <div className="flex items-start justify-center gap-3 text-xs sm:text-sm mb-3">
          <div className="text-center flex-1 max-w-[45%]">
            <a
              href={getScryfallCardUrl(result.cardAScryfallId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-semibold"
            >
              {result.cardAName}
            </a>
          </div>
          <span className="text-gray-500 flex-shrink-0 pt-0.5">vs</span>
          <div className="text-center flex-1 max-w-[45%]">
            <a
              href={getScryfallCardUrl(result.cardBScryfallId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-semibold"
            >
              {result.cardBName}
            </a>
          </div>
        </div>

        {/* All three metrics; active one is highlighted */}
        <div className="max-w-md mx-auto space-y-1">
          <MetricRow
            metric="IIH"
            active={result.metric === "IIH"}
            valueA={result.cardAIih}
            valueB={result.cardBIih}
          />
          <MetricRow
            metric="GIH_WR"
            active={result.metric === "GIH_WR"}
            valueA={result.cardAGihWr}
            valueB={result.cardBGihWr}
          />
          <MetricRow
            metric="ALSA"
            active={result.metric === "ALSA"}
            valueA={result.cardAAlsa}
            valueB={result.cardBAlsa}
          />
        </div>

        <p className="text-center text-gray-500 text-xs mt-3">
          <span className="hidden sm:inline">Press Enter or Space to continue</span>
          <span className="sm:hidden">Tap Next to continue</span>
        </p>
      </div>
    </div>
  );
}
