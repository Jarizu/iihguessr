"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { RatingForm, type SavedRating } from "@/components/ratings/RatingForm";
import {
  MIN_RATINGS_TO_RANK,
  RATING_TAGS,
  type RatingTag,
} from "@/lib/ratings/constants";
import type { SetRanking } from "@/lib/ratings/rankings";

interface RatingsResponse {
  totalRatings: number;
  sets: SetRanking[];
  mine: Record<string, SavedRating> | null;
}

const TAG_LABEL: Record<string, string> = Object.fromEntries(
  RATING_TAGS.map((t) => [t.value, t.label]),
);

const filterChip = (active: boolean) =>
  `px-3 py-1 rounded-full text-sm border transition-colors ${
    active
      ? "bg-purple-600 border-purple-500 text-white"
      : "border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500"
  }`;

export default function SetsPage() {
  const { status } = useSession();
  const [experiencedOnly, setExperiencedOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState<RatingTag | null>(null);
  const [data, setData] = useState<RatingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/ratings${experiencedOnly ? "?experienced=1" : ""}`,
      );
      if (!res.ok) throw new Error("Couldn't load set rankings");
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load set rankings");
    }
  }, [experiencedOnly]);

  useEffect(() => {
    load();
  }, [load, status]);

  const rows = (data?.sets ?? []).filter(
    (s) => !tagFilter || s.tags.some((t) => t.tag === tagFilter),
  );
  const ranked = rows.filter((s) => s.rank !== null);
  const unranked = rows.filter((s) => s.rank === null);

  const renderRow = (s: SetRanking) => {
    const mine = data?.mine?.[s.code];
    const isEditing = editing === s.code;
    return (
      <li
        key={s.code}
        className="bg-neutral-800/30 rounded-lg border border-neutral-700 p-4"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="w-8 text-neutral-500 font-beleren text-lg tabular-nums">
            {s.rank ?? ""}
          </span>
          <div className="flex-1 min-w-[10rem]">
            <p className="text-neutral-100 font-semibold">{s.name}</p>
            <p className="text-neutral-500 text-xs">
              {s.code.toUpperCase()} · {s.releaseDate.slice(0, 4)} ·{" "}
              {s.count} {s.count === 1 ? "rating" : "ratings"}
            </p>
            {s.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {s.tags.map((t) => (
                  <span
                    key={t.tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-neutral-700/60 text-neutral-300"
                  >
                    {TAG_LABEL[t.tag] ?? t.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            {s.score !== null ? (
              <p className="font-beleren text-2xl text-purple-300 tabular-nums">
                {s.score.toFixed(1)}
              </p>
            ) : (
              <p className="text-neutral-500 text-sm">
                {MIN_RATINGS_TO_RANK - s.count} more to rank
              </p>
            )}
          </div>
          <div className="w-full sm:w-auto sm:min-w-[7rem] sm:text-right">
            {status === "authenticated" ? (
              <button
                onClick={() => setEditing(isEditing ? null : s.code)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                {mine ? `Your rating: ${mine.fun} · Edit` : "Rate it"}
              </button>
            ) : status === "unauthenticated" ? (
              <a
                href="/api/auth/signin?callbackUrl=/sets"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Sign in to rate
              </a>
            ) : null}
          </div>
        </div>
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <RatingForm
              setCode={s.code}
              setName={s.name}
              initial={mine}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                load();
              }}
            />
          </div>
        )}
      </li>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="font-beleren text-2xl text-purple-400 hover:text-purple-300"
          >
            IIHGuessr
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/game" className="text-neutral-400 hover:text-neutral-200">
              Play
            </Link>
            <Link href="/stats" className="text-neutral-400 hover:text-neutral-200">
              Stats
            </Link>
          </div>
        </nav>

        <h1 className="font-beleren text-3xl text-neutral-200 mb-2">
          Set Rankings
        </h1>
        <p className="text-neutral-400 mb-1">
          How fun is each set to draft? Rated by IIHGuessr players.
        </p>
        <p className="text-neutral-500 text-sm mb-6">
          Scores adjust for people who rate everything high or low, and a set
          needs {MIN_RATINGS_TO_RANK} ratings before it&apos;s ranked.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setExperiencedOnly(false)}
            className={filterChip(!experiencedOnly)}
          >
            All raters
          </button>
          <button
            onClick={() => setExperiencedOnly(true)}
            className={filterChip(experiencedOnly)}
          >
            Experienced (6+ drafts)
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {RATING_TAGS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTagFilter(tagFilter === t.value ? null : t.value)}
              className={filterChip(tagFilter === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 mb-6">{error}</p>}

        {!data && !error && (
          <div className="animate-pulse text-neutral-400 py-12 text-center">
            Loading rankings...
          </div>
        )}

        {data && data.totalRatings === 0 && (
          <div className="bg-neutral-800/50 rounded-lg p-6 mb-8 text-neutral-300">
            No ratings yet. Rate the sets you&apos;ve drafted to get the
            rankings started.
          </div>
        )}

        {data && rows.length === 0 && tagFilter && (
          <p className="text-neutral-400 py-6">
            No sets are tagged &ldquo;{TAG_LABEL[tagFilter]}&rdquo; yet.
          </p>
        )}

        {ranked.length > 0 && <ol className="space-y-3 mb-10">{ranked.map(renderRow)}</ol>}

        {unranked.length > 0 && (
          <>
            <h2 className="font-beleren text-xl text-neutral-300 mb-3">
              Needs more ratings
            </h2>
            <ul className="space-y-3">{unranked.map(renderRow)}</ul>
          </>
        )}
      </div>
    </main>
  );
}
