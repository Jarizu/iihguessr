"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { StatsResponse } from "@/types";

export default function StatsPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchStats() {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [status]);

  if (status === "loading") {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-6">Sign in to view your stats.</p>
          <a
            href="/api/auth/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
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
          <Link href="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300">
            IIHGuessr
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/game" className="text-gray-400 hover:text-gray-200">
              Play
            </Link>
            <Link href="/review" className="text-gray-400 hover:text-gray-200">
              Review
            </Link>
          </div>
        </nav>

        <h1 className="text-3xl font-bold text-gray-200 mb-8">Your Statistics</h1>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-400">Loading stats...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {stats && !isLoading && (
          <div className="space-y-8">
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Guesses" value={stats.totalGuesses.toString()} />
              <StatCard
                label="Accuracy"
                value={`${stats.accuracy.toFixed(1)}%`}
                color={
                  stats.accuracy >= 70
                    ? "green"
                    : stats.accuracy >= 50
                      ? "yellow"
                      : "red"
                }
              />
              <StatCard label="Current Streak" value={stats.currentStreak.toString()} />
              <StatCard label="Best Streak" value={stats.bestStreak.toString()} color="blue" />
            </div>

            {/* Set breakdown */}
            {Object.keys(stats.setBreakdown).length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Per-Set Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-2 text-gray-400">Set</th>
                        <th className="py-2 text-gray-400 text-right">Guesses</th>
                        <th className="py-2 text-gray-400 text-right">Correct</th>
                        <th className="py-2 text-gray-400 text-right">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.setBreakdown).map(([setCode, setStats]) => (
                        <tr key={setCode} className="border-b border-gray-800">
                          <td className="py-3 text-gray-200 font-medium">{setCode}</td>
                          <td className="py-3 text-gray-300 text-right">{setStats.total}</td>
                          <td className="py-3 text-gray-300 text-right">{setStats.correct}</td>
                          <td
                            className={`py-3 text-right font-medium ${
                              setStats.accuracy >= 70
                                ? "text-green-400"
                                : setStats.accuracy >= 50
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {setStats.accuracy.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Biggest miss */}
            {stats.biggestMiss && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Biggest Miss</h2>
                <div className="text-gray-300">
                  <p>
                    You picked <span className="font-bold text-red-400">{stats.biggestMiss.selectedName}</span>
                  </p>
                  <p className="mt-2">
                    <span className="text-gray-400">Card A:</span> {stats.biggestMiss.cardA.name} (
                    {(stats.biggestMiss.cardA.iih * 100).toFixed(1)}%)
                  </p>
                  <p>
                    <span className="text-gray-400">Card B:</span> {stats.biggestMiss.cardB.name} (
                    {(stats.biggestMiss.cardB.iih * 100).toFixed(1)}%)
                  </p>
                  <p className="mt-2 text-yellow-400">
                    Difference: {(stats.biggestMiss.difference * 100).toFixed(1)}pp
                  </p>
                </div>
              </div>
            )}

            {stats.totalGuesses === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No guesses yet. Start playing to see your stats!</p>
                <Link
                  href="/game"
                  className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  Start Playing
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color = "gray",
}: {
  label: string;
  value: string;
  color?: "gray" | "green" | "yellow" | "red" | "blue";
}) {
  const colorClasses = {
    gray: "text-gray-200",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
