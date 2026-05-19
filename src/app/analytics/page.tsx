"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Metric, METRIC_CONFIG, METRICS, DEFAULT_METRIC, isMetric } from "@/lib/metrics";

interface ManaValueData {
  name: string;
  manaValue: number;
  value: number;
  isCreature: boolean;
  gamesPlayed: number;
}

interface GPPercentData {
  name: string;
  gpPercent: number;
  value: number;
  gamesPlayed: number;
  typeLine: string;
}

interface ArchetypeStats {
  colorPair: string;
  median: number;
  mean: number;
  min: number;
  max: number;
  count: number;
}

interface SetOption {
  code: string;
  name: string;
}

const METRIC_STORAGE_KEY = "iihguessr_metric";

export default function AnalyticsPage() {
  const [sets, setSets] = useState<SetOption[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<Metric>(DEFAULT_METRIC);
  const [manaValueData, setManaValueData] = useState<ManaValueData[]>([]);
  const [gpPercentData, setGPPercentData] = useState<GPPercentData[]>([]);
  const [archetypeStats, setArchetypeStats] = useState<ArchetypeStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore metric preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(METRIC_STORAGE_KEY);
    if (stored && isMetric(stored)) setSelectedMetric(stored);
  }, []);

  // Load sets list
  useEffect(() => {
    let mounted = true;
    fetch("/api/sets")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const fetched = (data.sets || []).map((s: { code: string; name: string }) => ({
          code: s.code,
          name: s.name,
        }));
        setSets(fetched);
        // Default to the most recently released set (the API sorts desc).
        if (fetched.length > 0) setSelectedSet(fetched[0].code);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!selectedSet) return;
      setLoading(true);
      try {
        const qs = `set=${selectedSet}&metric=${selectedMetric}`;
        const [mvRes, gpRes, archRes] = await Promise.all([
          fetch(`/api/analytics?${qs}&type=mana-value`),
          fetch(`/api/analytics?${qs}&type=gp-percent`),
          fetch(`/api/analytics?${qs}&type=archetype`),
        ]);

        const [mvData, gpData, archData] = await Promise.all([
          mvRes.json(),
          gpRes.json(),
          archRes.json(),
        ]);

        setManaValueData(mvData.data || []);
        setGPPercentData(gpData.data || []);
        setArchetypeStats(archData.statistics || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedSet, selectedMetric]);

  const creatures = manaValueData.filter((d) => d.isCreature);
  const nonCreatures = manaValueData.filter((d) => !d.isCreature);

  const cfg = METRIC_CONFIG[selectedMetric];
  const yLabel =
    selectedMetric === "ALSA" ? `${cfg.label} (picks)` : `${cfg.label} (pp)`;
  const formatY = (v: number): string =>
    selectedMetric === "ALSA" ? v.toFixed(2) : `${v.toFixed(1)}pp`;

  const handleMetricChange = (m: Metric) => {
    setSelectedMetric(m);
    if (typeof window !== "undefined") {
      localStorage.setItem(METRIC_STORAGE_KEY, m);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-beleren text-3xl sm:text-4xl text-white mb-2">
              {cfg.label} Analytics
            </h1>
            <p className="text-neutral-400">
              {selectedMetric === "IIH"
                ? "Explore the limitations and biases in IIH data."
                : `Explore card data through the lens of ${cfg.longLabel}.`}
            </p>
          </div>
          <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm">
            ← Back to Home
          </Link>
        </div>

        {/* Selectors */}
        <div className="bg-neutral-800/50 rounded-lg p-4 flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="analytics-set" className="text-neutral-400 text-sm mr-2">
              Set:
            </label>
            <select
              id="analytics-set"
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="bg-neutral-800 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {sets.map((set) => (
                <option key={set.code} value={set.code}>
                  {set.name} ({set.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="analytics-metric" className="text-neutral-400 text-sm mr-2">
              Metric:
            </label>
            <select
              id="analytics-metric"
              value={selectedMetric}
              onChange={(e) => handleMetricChange(e.target.value as Metric)}
              className="bg-neutral-800 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {METRIC_CONFIG[m].label} — {METRIC_CONFIG[m].longLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-neutral-400 py-12">Loading analytics...</div>
        ) : (
          <>
            {/* Chart 1: vs Mana Value */}
            <div className="bg-neutral-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="font-beleren text-2xl text-white mb-2">
                  {cfg.label} vs. Mana Value
                </h2>
                {selectedMetric === "IIH" && (
                  <p className="text-neutral-400 text-sm">
                    Aggro bias: low-mana-value cards (especially creatures) tend to have lower IIH
                    because aggressive decks win before drawing matters.
                  </p>
                )}
              </div>
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="manaValue"
                    name="Mana Value"
                    stroke="#9CA3AF"
                    label={{ value: "Mana Value", position: "insideBottom", offset: -8, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="value"
                    name={cfg.label}
                    stroke="#9CA3AF"
                    label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg">
                            <p className="text-white font-semibold">{data.name}</p>
                            <p className="text-neutral-300 text-sm">MV: {data.manaValue}</p>
                            <p className="text-neutral-300 text-sm">
                              {cfg.label}: {formatY(data.value)}
                            </p>
                            <p className="text-neutral-400 text-xs">Games: {data.gamesPlayed}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10 }} />
                  {selectedMetric === "IIH" && (
                    <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
                  )}
                  <Scatter name="Creatures" data={creatures} fill="#864bff" fillOpacity={0.7} />
                  <Scatter name="Non-Creatures" data={nonCreatures} fill="#EF4444" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: vs GP% */}
            <div className="bg-neutral-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="font-beleren text-2xl text-white mb-2">
                  {cfg.label} vs. Games Played %
                </h2>
                {selectedMetric === "IIH" && (
                  <p className="text-neutral-400 text-sm">
                    Cards played in fewer games (low GP%) often have inflated IIH because
                    they only end up in decks where they're good.
                  </p>
                )}
              </div>
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="gpPercent"
                    name="GP%"
                    stroke="#9CA3AF"
                    label={{ value: "Games Played %", position: "insideBottom", offset: -8, fill: "#9CA3AF" }}
                    domain={[0, "auto"]}
                  />
                  <YAxis
                    type="number"
                    dataKey="value"
                    name={cfg.label}
                    stroke="#9CA3AF"
                    label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg max-w-xs">
                            <p className="text-white font-semibold">{data.name}</p>
                            <p className="text-neutral-300 text-sm">GP%: {data.gpPercent.toFixed(2)}%</p>
                            <p className="text-neutral-300 text-sm">
                              {cfg.label}: {formatY(data.value)}
                            </p>
                            <p className="text-neutral-400 text-xs">{data.typeLine}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {selectedMetric === "IIH" && (
                    <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
                  )}
                  <Scatter name="Cards" data={gpPercentData} fill="#864bff" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Archetype */}
            <div className="bg-neutral-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="font-beleren text-2xl text-white mb-2">
                  {cfg.label} by Color Pair
                </h2>
                {selectedMetric === "IIH" && (
                  <p className="text-neutral-400 text-sm">
                    Strong archetypes often have lower median IIH because the deck wins
                    regardless of which specific cards are drawn.
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-neutral-400 border-b border-neutral-700">
                    <tr>
                      <th className="py-3 px-4">Color Pair</th>
                      <th className="py-3 px-4">Cards</th>
                      <th className="py-3 px-4">Median {cfg.label}</th>
                      <th className="py-3 px-4">Mean {cfg.label}</th>
                      <th className="py-3 px-4">Min {cfg.label}</th>
                      <th className="py-3 px-4">Max {cfg.label}</th>
                      <th className="py-3 px-4">Range</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-300">
                    {archetypeStats
                      .sort((a, b) =>
                        cfg.higherIsBetter ? b.median - a.median : a.median - b.median,
                      )
                      .map((stat) => (
                        <tr
                          key={stat.colorPair}
                          className="border-b border-neutral-800 hover:bg-neutral-700/30"
                        >
                          <td className="py-3 px-4 font-semibold">{stat.colorPair}</td>
                          <td className="py-3 px-4">{stat.count}</td>
                          <td className="py-3 px-4">{formatY(stat.median)}</td>
                          <td className="py-3 px-4">{formatY(stat.mean)}</td>
                          <td className="py-3 px-4 text-red-400">{formatY(stat.min)}</td>
                          <td className="py-3 px-4 text-green-400">{formatY(stat.max)}</td>
                          <td className="py-3 px-4">{formatY(stat.max - stat.min)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
