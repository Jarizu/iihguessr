"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DraftFormat } from "@/types";
import { DEFAULT_SET, DEFAULT_FORMAT } from "@/lib/utils/constants";
import { useGame } from "@/hooks/useGame";
import { CardPair } from "./CardPair";
import { ResultOverlay } from "./ResultOverlay";
import { ScoreTracker } from "./ScoreTracker";
import { SetSelector } from "./SetSelector";

export function GameBoard() {
  const { data: session, status } = useSession();
  const [selectedSet, setSelectedSet] = useState(DEFAULT_SET);

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
  } = useGame(selectedSet);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!currentPair || isLoading) return;

      // Card selection
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
        // Result shown - advance to next
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nextPair();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPair, selectedCardId, result, isLoading, selectCard, submitGuess, nextPair]);

  // Handle card selection
  const handleSelect = useCallback(
    (cardId: string) => {
      if (result) return;
      selectCard(cardId);
    },
    [result, selectCard]
  );

  // Determine card results for display
  const getCardResult = (cardId: string) => {
    if (!result) return null;
    if (cardId === result.correctCardId) return "correct" as const;
    if (cardId === selectedCardId) return "incorrect" as const;
    return null;
  };

  // Auth is optional - anonymous users can still play

  return (
    <div className="flex flex-col items-center gap-6 pb-48">
      {/* Header with set selector and score */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
        <SetSelector
          selectedSet={selectedSet}
          onSetChange={setSelectedSet}
          dataAsOf={dataAsOf || undefined}
        />
        <ScoreTracker
          currentStreak={stats.currentStreak}
          bestStreak={stats.bestStreak}
          accuracy={stats.accuracy}
          total={stats.total}
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-400">Loading cards...</div>
        </div>
      )}

      {/* Error state */}
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

      {/* Game area */}
      {currentPair && !isLoading && (
        <>
          {/* Instruction - always shown */}
          <p className="text-gray-400 text-center">
            Which card has the higher IWD?
          </p>

          {/* Card pair */}
          <CardPair
            cardA={currentPair.cardA}
            cardB={currentPair.cardB}
            selectedCardId={selectedCardId}
            resultA={getCardResult(currentPair.cardA.id)}
            resultB={getCardResult(currentPair.cardB.id)}
            disabled={!!result || isSubmitting}
            onSelect={handleSelect}
            iihA={result ? result.cardAIih : null}
            iihB={result ? result.cardBIih : null}
          />

          {/* Submit button (when card selected but not submitted) */}
          {selectedCardId && !result && (
            <button
              onClick={submitGuess}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Guess"}
            </button>
          )}

          {/* Result overlay */}
          {result && <ResultOverlay result={result} onNext={nextPair} />}
        </>
      )}
    </div>
  );
}
