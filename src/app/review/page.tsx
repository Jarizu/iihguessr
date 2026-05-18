"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { MistakeItem } from "@/types";
import { METRIC_CONFIG, correctCardId as pickCorrectId } from "@/lib/metrics";

export default function ReviewPage() {
  const { data: session, status } = useSession();
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"difference" | "recent">("difference");

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchMistakes() {
      try {
        const response = await fetch(`/api/mistakes?sort=${sort}&limit=50`);
        if (!response.ok) {
          throw new Error("Failed to fetch mistakes");
        }
        const data = await response.json();
        setMistakes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMistakes();
  }, [status, sort]);

  if (status === "loading") {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-pulse text-neutral-400">Loading...</div>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-neutral-200 mb-4">Sign In Required</h2>
          <p className="text-neutral-400 mb-6">Sign in to review your mistakes.</p>
          <a
            href="/api/auth/signin"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg"
          >
            Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-8">
          <Link href="/" className="text-2xl font-bold text-purple-400 hover:text-purple-300">
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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-200">Review Mistakes</h1>

          {/* Sort toggle */}
          <div className="flex rounded-lg overflow-hidden border border-neutral-600">
            <button
              onClick={() => setSort("difference")}
              className={`px-3 py-2 text-sm transition-colors ${
                sort === "difference"
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              Most Wrong
            </button>
            <button
              onClick={() => setSort("recent")}
              className={`px-3 py-2 text-sm transition-colors ${
                sort === "recent"
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              Most Recent
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-pulse text-neutral-400">Loading mistakes...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && mistakes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No mistakes yet. Keep playing!</p>
            <Link
              href="/game"
              className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Continue Playing
            </Link>
          </div>
        )}

        {!isLoading && mistakes.length > 0 && (
          <div className="space-y-6">
            {mistakes.map((mistake) => (
              <MistakeCard key={mistake.id} mistake={mistake} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function MistakeCard({ mistake }: { mistake: MistakeItem }) {
  const cfg = METRIC_CONFIG[mistake.metric];
  const selectedCard =
    mistake.selectedCardId === mistake.cardA.id ? mistake.cardA : mistake.cardB;
  const correctId = pickCorrectId(
    mistake.metric,
    mistake.cardA.id,
    mistake.cardA.value,
    mistake.cardB.id,
    mistake.cardB.value,
  );
  const correctCard =
    correctId === mistake.cardA.id ? mistake.cardA : mistake.cardB;

  const isABetter = correctId === mistake.cardA.id;

  return (
    <div className="bg-neutral-800/50 rounded-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-4 justify-center">
          <div className="flex flex-col items-center">
            <div
              className={`relative rounded-lg overflow-hidden ring-2 ${
                mistake.cardA.id === correctCard.id
                  ? "ring-green-500"
                  : mistake.cardA.id === selectedCard.id
                    ? "ring-red-500"
                    : "ring-neutral-600"
              }`}
            >
              <Image
                src={mistake.cardA.imageUri}
                alt={mistake.cardA.name}
                width={146}
                height={204}
                className="object-cover"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-[146px] truncate">
              {mistake.cardA.name}
            </p>
            <p
              className={`text-sm font-bold ${
                isABetter ? "text-green-400" : "text-neutral-300"
              }`}
            >
              {cfg.format(mistake.cardA.value)}
            </p>
          </div>

          <div className="flex items-center">
            <span className="text-neutral-500 text-sm">vs</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`relative rounded-lg overflow-hidden ring-2 ${
                mistake.cardB.id === correctCard.id
                  ? "ring-green-500"
                  : mistake.cardB.id === selectedCard.id
                    ? "ring-red-500"
                    : "ring-neutral-600"
              }`}
            >
              <Image
                src={mistake.cardB.imageUri}
                alt={mistake.cardB.name}
                width={146}
                height={204}
                className="object-cover"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-[146px] truncate">
              {mistake.cardB.name}
            </p>
            <p
              className={`text-sm font-bold ${
                !isABetter ? "text-green-400" : "text-neutral-300"
              }`}
            >
              {cfg.format(mistake.cardB.value)}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center text-sm">
          <p className="text-neutral-400">
            You picked: <span className="text-red-400 font-medium">{selectedCard.name}</span>
          </p>
          <p className="text-neutral-400">
            Correct: <span className="text-green-400 font-medium">{correctCard.name}</span>
          </p>
          <p className="text-yellow-400 mt-2">
            Difference: {cfg.formatDiff(mistake.valueDifference)}
          </p>
          <p className="text-neutral-500 text-xs mt-2">
            {mistake.setCode.toUpperCase()} | {cfg.label} | {new Date(mistake.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
