"use client";

import { useState } from "react";
import {
  EXPERIENCE_LEVELS,
  FUN_MAX,
  FUN_MIN,
  RATING_TAGS,
  type Experience,
  type RatingTag,
} from "@/lib/ratings/constants";

export interface SavedRating {
  fun: number;
  experience: string;
  tags: string[];
}

interface RatingFormProps {
  setCode: string;
  setName: string;
  initial?: SavedRating | null;
  onSaved: (rating: SavedRating | null) => void;
  onCancel?: () => void;
}

const FUN_VALUES = Array.from(
  { length: FUN_MAX - FUN_MIN + 1 },
  (_, i) => FUN_MIN + i,
);

const chip = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm border transition-colors ${
    active
      ? "bg-purple-600 border-purple-500 text-white"
      : "bg-neutral-800 border-neutral-600 text-neutral-300 hover:border-neutral-400"
  }`;

export function RatingForm({
  setCode,
  setName,
  initial,
  onSaved,
  onCancel,
}: RatingFormProps) {
  const [fun, setFun] = useState<number | null>(initial?.fun ?? null);
  const [experience, setExperience] = useState<Experience | null>(
    (initial?.experience as Experience) ?? null,
  );
  const [tags, setTags] = useState<RatingTag[]>(
    (initial?.tags as RatingTag[]) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (t: RatingTag) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  async function send(method: "PUT" | "DELETE") {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ratings/${setCode}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PUT" ? JSON.stringify({ fun, experience, tags }) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't save your rating");
      }
      onSaved(method === "PUT" ? { fun: fun!, experience: experience!, tags } : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your rating");
    } finally {
      setSaving(false);
    }
  }

  return (
    // data-rating-form: the game's keyboard shortcuts ignore keys pressed in here.
    <div data-rating-form className="space-y-4 text-left">
      <div>
        <p className="text-neutral-200 mb-2">
          How fun is <span className="font-semibold">{setName}</span> to draft?
        </p>
        <div className="grid grid-cols-5 sm:flex gap-1.5 max-w-[16rem] sm:max-w-none">
          {FUN_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFun(v)}
              aria-pressed={fun === v}
              className={`sm:w-9 h-9 rounded-lg text-sm font-semibold border transition-colors tabular-nums ${
                fun === v
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-neutral-800 border-neutral-600 text-neutral-300 hover:border-neutral-400"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-1.5">
          1 = not fun · 10 = one of your favorites
        </p>
      </div>

      <div>
        <p className="text-neutral-200 mb-2">How much have you drafted it?</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_LEVELS.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => setExperience(e.value)}
              aria-pressed={experience === e.value}
              className={chip(experience === e.value)}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-neutral-200 mb-2">
          Describe it <span className="text-neutral-500 text-sm">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RATING_TAGS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTag(t.value)}
              aria-pressed={tags.includes(t.value)}
              className={chip(tags.includes(t.value))}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => send("PUT")}
          disabled={saving || fun === null || experience === null}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:text-neutral-400 text-white font-semibold py-2 px-5 rounded-lg transition-colors"
        >
          {saving ? "Saving..." : initial ? "Update rating" : "Save rating"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-200 text-sm"
          >
            Cancel
          </button>
        )}
        {initial && (
          <button
            type="button"
            onClick={() => send("DELETE")}
            disabled={saving}
            className="text-neutral-500 hover:text-red-400 text-sm ml-auto"
          >
            Remove my rating
          </button>
        )}
      </div>
    </div>
  );
}
