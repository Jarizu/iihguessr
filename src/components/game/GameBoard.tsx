"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_SET } from "@/lib/utils/constants";
import { Metric, DEFAULT_METRIC, isMetric, metricInstruction } from "@/lib/metrics";
import { useGame } from "@/hooks/useGame";
import { CardPair } from "./CardPair";
import { ResultOverlay } from "./ResultOverlay";
import { ScoreTracker } from "./ScoreTracker";
import { SetSelector } from "./SetSelector";
import { MetricSelector } from "./MetricSelector";

const METRIC_STORAGE_KEY = "iihguessr_metric";

export function GameBoard() {
  const [selectedSet, setSelectedSet] = useState(DEFAULT_SET);
  const [selectedMetric, setSelectedMetric] = useState<Metric>(DEFAULT_METRIC);

  // Restore metric from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(METRIC_STORAGE_KEY);
    if (stored && isMetric(stored)) setSelectedMetric(stored);
  }, []);

  const handleMetricChange = useCallback((m: Metric) => {
    setSelectedMetric(m);
    if (typeof window !== "undefined") {
      localStorage.setItem(METRIC_STORAGE_KEY, m);
    }
  }, []);

  const {
    currentPair,
    selectedCardId,
    result,
    isLoading,
    isSubmitting,
    error,
    stats,
    dataAsOf,
    selectCard,
    submitGuess,
    nextPair,
  } = useGame(selectedSet, selectedMetric);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!currentPair || isLoading) return;

      if (!result) {
        if (e.key === "1") {
          selectCard(currentPair.cardA.id);
        } else if (e.key === "2") {
          selectCard(currentPair.cardB.id);
        } else if ((e.key === "Enter" || e.key === " ") && selectedCardId) {
          e.preventDefault();
          submitGuess();
        }
      } else {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nextPair();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentPair,
    selectedCardId,
    result,
    isLoading,
    selectCard,
    submitGuess,
    nextPair,
  ]);

  const handleSelect = useCallback(
    (cardId: string) => {
      if (result) return;
      selectCard(cardId);
    },
    [result, selectCard],
  );

  const getCardResult = (cardId: string) => {
    if (!result) return null;
    if (cardId === result.correctCardId) return "correct" as const;
    if (cardId === selectedCardId) return "incorrect" as const;
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-6 pb-48">
      {/* Header */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2 items-start">
          <SetSelector
            selectedSet={selectedSet}
            onSetChange={setSelectedSet}
            dataAsOf={dataAsOf || undefined}
          />
          <MetricSelector
            selectedMetric={selectedMetric}
            onMetricChange={handleMetricChange}
          />
        </div>
        <ScoreTracker
          currentStreak={stats.currentStreak}
          bestStreak={stats.bestStreak}
          accuracy={stats.accuracy}
          total={stats.total}
        />
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-400">Loading cards...</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {currentPair && !isLoading && (
        <>
          <p className="text-gray-400 text-center">
            {metricInstruction(selectedMetric)}
          </p>

          <CardPair
            cardA={currentPair.cardA}
            cardB={currentPair.cardB}
            selectedCardId={selectedCardId}
            resultA={getCardResult(currentPair.cardA.id)}
            resultB={getCardResult(currentPair.cardB.id)}
            disabled={!!result || isSubmitting}
            onSelect={handleSelect}
            valueA={result ? result.cardAValue : null}
            valueB={result ? result.cardBValue : null}
            metric={selectedMetric}
          />

          {selectedCardId && !result && (
            <button
              onClick={submitGuess}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Guess"}
            </button>
          )}

          {result && <ResultOverlay result={result} onNext={nextPair} />}
        </>
      )}
    </div>
  );
}
