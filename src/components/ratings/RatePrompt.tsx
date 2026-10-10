"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { RatingForm, type SavedRating } from "./RatingForm";
import { ROUNDS_BEFORE_PROMPT } from "@/lib/ratings/constants";

const DISMISSED_KEY = "iihguessr_rating_prompt_dismissed";

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeDismissed(codes: string[]) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(codes));
  } catch {
    // Storage blocked: the prompt may come back next visit; harmless.
  }
}

interface RatePromptProps {
  setCode: string;
  setName: string;
  /** Rounds played in this set during this visit. */
  rounds: number;
}

/**
 * After ROUNDS_BEFORE_PROMPT rounds in a set, ask signed-in players who
 * haven't rated it how fun it is. Shown once per set; "Not now" hides it
 * for that set for good.
 */
export function RatePrompt({ setCode, setName, rounds }: RatePromptProps) {
  const { status } = useSession();
  const [mine, setMine] = useState<Record<string, SavedRating> | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [mode, setMode] = useState<"ask" | "form" | "thanks">("ask");

  const eligible = status === "authenticated" && rounds >= ROUNDS_BEFORE_PROMPT;

  useEffect(() => setDismissed(readDismissed()), []);

  // Load the player's existing ratings once, when the prompt might first show.
  useEffect(() => {
    if (!eligible || mine) return;
    fetch("/api/ratings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMine(data?.mine ?? {}))
      .catch(() => setMine({}));
  }, [eligible, mine]);

  useEffect(() => setMode("ask"), [setCode]);

  if (!eligible || !mine) return null;
  if (mode !== "thanks" && (mine[setCode] || dismissed.includes(setCode))) {
    return null;
  }

  const dismiss = () => {
    const next = [...new Set([...dismissed, setCode])];
    setDismissed(next);
    writeDismissed(next);
  };

  return (
    <div
      data-rating-form
      className="w-full bg-neutral-800/30 rounded-lg p-4 border border-neutral-700"
    >
      {mode === "ask" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-neutral-200 flex-1 min-w-[12rem]">
            How fun is <span className="font-semibold">{setName}</span> to draft?
          </p>
          <button
            onClick={() => setMode("form")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 px-4 rounded-lg text-sm"
          >
            Rate it
          </button>
          <button
            onClick={dismiss}
            className="text-neutral-400 hover:text-neutral-200 text-sm"
          >
            Not now
          </button>
        </div>
      )}
      {mode === "form" && (
        <RatingForm
          setCode={setCode}
          setName={setName}
          onCancel={() => setMode("ask")}
          onSaved={(rating) => {
            if (rating) setMine({ ...mine, [setCode]: rating });
            setMode("thanks");
          }}
        />
      )}
      {mode === "thanks" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-neutral-200 flex-1">
            Thanks! Your rating helps rank every set.
          </p>
          <Link href="/sets" className="text-purple-400 hover:text-purple-300 text-sm">
            See the rankings →
          </Link>
          <button
            onClick={() => setMode("ask")}
            className="text-neutral-400 hover:text-neutral-200 text-sm"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
