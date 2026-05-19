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
      className={`grid grid-cols-[1fr_5rem_1fr] gap-3 items-center text-xs sm:text-sm ${
        active ? "text-white font-semibold" : "text-neutral-500"
      }`}
    >
      <span className="text-right tabular-nums">{fmt(valueA)}</span>
      <span className="text-center text-[10px] sm:text-xs uppercase tracking-wider text-neutral-400">
        {cfg.label}
      </span>
      <span className="text-left tabular-nums">{fmt(valueB)}</span>
    </div>
  );
}

export function ResultOverlay({ result, onNext }: ResultOverlayProps) {
  const activeCfg = METRIC_CONFIG[result.metric];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-700 p-3 md:p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto">
        {/* Result status (centered) and Next button (pinned right on web) */}
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-3 sm:gap-0">
          <div className="hidden sm:block sm:flex-1" />
          <div className="flex items-center justify-center gap-2">
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
            <span className="text-xs text-neutral-500 ml-2">
              ({activeCfg.label}: Δ {activeCfg.formatDiff(result.valueDifference)})
            </span>
          </div>
          <div className="sm:flex-1 sm:flex sm:justify-end flex justify-center">
            <button
              onClick={onNext}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Card names — mirror the metric row layout so they line up on the same axis */}
        <div className="grid grid-cols-[1fr_5rem_1fr] gap-3 items-center text-xs sm:text-sm mb-3">
          <a
            href={getScryfallCardUrl(result.cardAScryfallId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-beleren text-purple-400 hover:text-purple-300 underline text-right truncate"
          >
            {result.cardAName}
          </a>
          <span className="text-neutral-500 text-center">vs</span>
          <a
            href={getScryfallCardUrl(result.cardBScryfallId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-beleren text-purple-400 hover:text-purple-300 underline text-left truncate"
          >
            {result.cardBName}
          </a>
        </div>

        {/* All three metrics; active one is highlighted */}
        <div className="space-y-1">
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

        <p className="text-center text-neutral-500 text-xs mt-3">
          <span className="hidden sm:inline">Press Enter or Space to continue</span>
          <span className="sm:hidden">Tap Next to continue</span>
        </p>
      </div>
    </div>
  );
}
