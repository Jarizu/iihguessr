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
import { SUPPORTED_SETS } from "@/lib/utils/constants";

interface ManaValueData {
  name: string;
  manaValue: number;
  iih: number;
  isCreature: boolean;
  gamesPlayed: number;
}

interface GPPercentData {
  name: string;
  gpPercent: number;
  iih: number;
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

export default function AnalyticsPage() {
  const [selectedSet, setSelectedSet] = useState("FDN");
  const [manaValueData, setManaValueData] = useState<ManaValueData[]>([]);
  const [gpPercentData, setGPPercentData] = useState<GPPercentData[]>([]);
  const [archetypeStats, setArchetypeStats] = useState<ArchetypeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all three analysis types
        const [mvRes, gpRes, archRes] = await Promise.all([
          fetch(`/api/analytics?set=${selectedSet}&type=mana-value`),
          fetch(`/api/analytics?set=${selectedSet}&type=gp-percent`),
          fetch(`/api/analytics?set=${selectedSet}&type=archetype`),
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
  }, [selectedSet]);

  const creatures = manaValueData.filter(d => d.isCreature);
  const nonCreatures = manaValueData.filter(d => !d.isCreature);

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              IWD Analytics
            </h1>
            <p className="text-gray-400">
              Explore the limitations and biases in IWD data
            </p>
          </div>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Set selector */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <label htmlFor="analytics-set" className="text-gray-400 text-sm mr-2">
            Set:
          </label>
          <select
            id="analytics-set"
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {SUPPORTED_SETS.map((set) => (
              <option key={set.code} value={set.code}>
                {set.name} ({set.code})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading analytics...</div>
        ) : (
          <>
            {/* Chart 1: IWD vs Mana Value */}
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Aggro Bias: IWD vs. Mana Value
                </h2>
                <p className="text-gray-400 text-sm">
                  Low-mana-value cards (especially creatures) tend to have lower IWD
                  because aggressive decks win before drawing matters. This doesn't mean
                  these cards are worse—just that IWD doesn't capture their value well.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="manaValue"
                    name="Mana Value"
                    stroke="#9CA3AF"
                    label={{ value: 'Mana Value', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="iih"
                    name="IWD"
                    stroke="#9CA3AF"
                    label={{ value: 'IWD (pp)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg">
                            <p className="text-white font-semibold">{data.name}</p>
                            <p className="text-gray-300 text-sm">MV: {data.manaValue}</p>
                            <p className="text-gray-300 text-sm">IWD: {data.iih.toFixed(1)}pp</p>
                            <p className="text-gray-400 text-xs">Games: {data.gamesPlayed}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
                  <Scatter
                    name="Creatures"
                    data={creatures}
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Scatter
                    name="Non-Creatures"
                    data={nonCreatures}
                    fill="#EF4444"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: IWD vs GP% */}
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Situational Cards: IWD vs. Games Played %
                </h2>
                <p className="text-gray-400 text-sm">
                  Cards played in fewer games (low GP%) often have inflated IWD because
                  they're only included in decks where they're good (e.g., sideboard cards,
                  niche hate cards). High IWD + low GP% suggests a situational card.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="gpPercent"
                    name="GP%"
                    stroke="#9CA3AF"
                    label={{ value: 'Games Played %', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
                    domain={[0, 'auto']}
                  />
                  <YAxis
                    type="number"
                    dataKey="iih"
                    name="IWD"
                    stroke="#9CA3AF"
                    label={{ value: 'IWD (pp)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg max-w-xs">
                            <p className="text-white font-semibold">{data.name}</p>
                            <p className="text-gray-300 text-sm">GP%: {data.gpPercent.toFixed(2)}%</p>
                            <p className="text-gray-300 text-sm">IWD: {data.iih.toFixed(1)}pp</p>
                            <p className="text-gray-400 text-xs">{data.typeLine}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
                  <Scatter
                    name="Cards"
                    data={gpPercentData}
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Archetype Analysis */}
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Archetype Paradox: IWD by Color Pair
                </h2>
                <p className="text-gray-400 text-sm">
                  Strong archetypes (high win rate) often have lower median IWD because
                  the deck wins regardless of which specific cards are drawn. Weak archetypes
                  show higher variance—only bombs matter when the deck is bad.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-400 border-b border-gray-700">
                    <tr>
                      <th className="py-3 px-4">Color Pair</th>
                      <th className="py-3 px-4">Cards</th>
                      <th className="py-3 px-4">Median IWD</th>
                      <th className="py-3 px-4">Mean IWD</th>
                      <th className="py-3 px-4">Min IWD</th>
                      <th className="py-3 px-4">Max IWD</th>
                      <th className="py-3 px-4">Range</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {archetypeStats
                      .sort((a, b) => b.median - a.median)
                      .map((stat) => (
                        <tr key={stat.colorPair} className="border-b border-gray-800 hover:bg-gray-700/30">
                          <td className="py-3 px-4 font-semibold">{stat.colorPair}</td>
                          <td className="py-3 px-4">{stat.count}</td>
                          <td className="py-3 px-4">{stat.median.toFixed(1)}pp</td>
                          <td className="py-3 px-4">{stat.mean.toFixed(1)}pp</td>
                          <td className="py-3 px-4 text-red-400">{stat.min.toFixed(1)}pp</td>
                          <td className="py-3 px-4 text-green-400">{stat.max.toFixed(1)}pp</td>
                          <td className="py-3 px-4">{(stat.max - stat.min).toFixed(1)}pp</td>
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
