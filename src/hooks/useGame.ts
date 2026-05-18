"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CardPair, GuessRequest, GuessResponse } from "@/types";
import { Metric } from "@/lib/metrics";

interface GameState {
  currentPair: CardPair | null;
  selectedCardId: string | null;
  result: GuessResponse | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  stats: {
    currentStreak: number;
    bestStreak: number;
    accuracy: number;
    total: number;
    correct: number;
  };
}

const STORAGE_KEY = "iihguessr_stats";

function loadLocalStats() {
  if (typeof window === "undefined") {
    return { currentStreak: 0, bestStreak: 0, total: 0, correct: 0 };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { currentStreak: 0, bestStreak: 0, total: 0, correct: 0 };
}

function saveLocalStats(stats: {
  currentStreak: number;
  bestStreak: number;
  total: number;
  correct: number;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function useGame(setCode: string, metric: Metric) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;

  const [state, setState] = useState<GameState>(() => {
    const localStats = loadLocalStats();
    return {
      currentPair: null,
      selectedCardId: null,
      result: null,
      isLoading: true,
      isSubmitting: false,
      error: null,
      stats: {
        currentStreak: localStats.currentStreak,
        bestStreak: localStats.bestStreak,
        accuracy:
          localStats.total > 0
            ? (localStats.correct / localStats.total) * 100
            : 0,
        total: localStats.total,
        correct: localStats.correct,
      },
    };
  });

  const [pairQueue, setPairQueue] = useState<CardPair[]>([]);
  const [dataAsOf, setDataAsOf] = useState<string | null>(null);

  const fetchPairs = useCallback(
    async (count: number = 3) => {
      const response = await fetch(
        `/api/cards/pair?set=${setCode}&metric=${metric}&count=${count}`,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch card pairs");
      }
      const data = await response.json();
      setDataAsOf(data.dataAsOf);
      return data.pairs as CardPair[];
    },
    [setCode, metric],
  );

  // Re-init game when set or metric changes
  useEffect(() => {
    let mounted = true;

    async function init() {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        currentPair: null,
        selectedCardId: null,
        result: null,
      }));
      setPairQueue([]);

      try {
        const pairs = await fetchPairs(3);
        if (!mounted) return;

        if (pairs.length === 0) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              "No card data available for this set/metric. Try syncing first.",
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          currentPair: pairs[0],
          isLoading: false,
        }));
        setPairQueue(pairs.slice(1));
      } catch (error) {
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load game",
        }));
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [fetchPairs, setCode, metric]);

  useEffect(() => {
    if (pairQueue.length < 2 && !state.isLoading) {
      fetchPairs(3)
        .then((pairs) => setPairQueue((prev) => [...prev, ...pairs]))
        .catch(console.error);
    }
  }, [pairQueue.length, state.isLoading, fetchPairs]);

  const selectCard = useCallback(
    (cardId: string) => {
      if (state.result || state.isSubmitting) return;
      setState((prev) => ({ ...prev, selectedCardId: cardId }));
    },
    [state.result, state.isSubmitting],
  );

  const submitGuess = useCallback(async () => {
    if (!state.currentPair || !state.selectedCardId || state.isSubmitting) {
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    const guessData: GuessRequest = {
      cardAId: state.currentPair.cardA.id,
      cardBId: state.currentPair.cardB.id,
      selectedCardId: state.selectedCardId,
      setCode,
      format: "PremierDraft",
      metric,
    };

    try {
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guessData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit guess");
      }

      const result: GuessResponse = await response.json();

      if (isAuthenticated) {
        setState((prev) => ({
          ...prev,
          result,
          isSubmitting: false,
          stats: {
            currentStreak: result.newStreak,
            bestStreak: Math.max(prev.stats.bestStreak, result.newStreak),
            accuracy: result.newAccuracy,
            total: result.newTotal,
            correct: prev.stats.correct + (result.isCorrect ? 1 : 0),
          },
        }));
      } else {
        setState((prev) => {
          const newTotal = prev.stats.total + 1;
          const newCorrect = prev.stats.correct + (result.isCorrect ? 1 : 0);
          const newStreak = result.isCorrect ? prev.stats.currentStreak + 1 : 0;
          const newBestStreak = Math.max(prev.stats.bestStreak, newStreak);

          const newStats = {
            currentStreak: newStreak,
            bestStreak: newBestStreak,
            total: newTotal,
            correct: newCorrect,
          };
          saveLocalStats(newStats);

          return {
            ...prev,
            result: {
              ...result,
              newStreak,
              newTotal,
              newAccuracy: (newCorrect / newTotal) * 100,
            },
            isSubmitting: false,
            stats: {
              ...newStats,
              accuracy: (newCorrect / newTotal) * 100,
            },
          };
        });
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : "Failed to submit guess",
      }));
    }
  }, [
    state.currentPair,
    state.selectedCardId,
    state.isSubmitting,
    setCode,
    metric,
    isAuthenticated,
  ]);

  const nextPair = useCallback(() => {
    if (pairQueue.length === 0) {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: "Loading more pairs...",
      }));
      return;
    }

    const [next, ...rest] = pairQueue;
    setPairQueue(rest);

    setState((prev) => ({
      ...prev,
      currentPair: next,
      selectedCardId: null,
      result: null,
    }));
  }, [pairQueue]);

  return {
    currentPair: state.currentPair,
    selectedCardId: state.selectedCardId,
    result: state.result,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,
    stats: state.stats,
    dataAsOf,
    selectCard,
    submitGuess,
    nextPair,
  };
}
