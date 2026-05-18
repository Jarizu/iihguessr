"use client";

import { Metric, METRICS, METRIC_CONFIG } from "@/lib/metrics";

interface MetricSelectorProps {
  selectedMetric: Metric;
  onMetricChange: (metric: Metric) => void;
}

export function MetricSelector({
  selectedMetric,
  onMetricChange,
}: MetricSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="metric-select"
        className="text-gray-400 text-sm whitespace-nowrap"
      >
        Metric:
      </label>
      <select
        id="metric-select"
        value={selectedMetric}
        onChange={(e) => onMetricChange(e.target.value as Metric)}
        className="bg-gray-800 text-white border border-gray-600 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
      >
        {METRICS.map((m) => {
          const cfg = METRIC_CONFIG[m];
          return (
            <option key={m} value={m}>
              {cfg.label} — {cfg.longLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}
