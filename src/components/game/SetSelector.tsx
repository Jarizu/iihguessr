"use client";

import { SUPPORTED_SETS } from "@/lib/utils/constants";
import { get17LandsSetUrl } from "@/lib/utils/17lands-urls";

interface SetSelectorProps {
  selectedSet: string;
  onSetChange: (setCode: string) => void;
  dataAsOf?: string;
}

export function SetSelector({
  selectedSet,
  onSetChange,
  dataAsOf,
}: SetSelectorProps) {
  return (
    <div className="flex flex-col gap-2 items-start w-full sm:w-auto">
      {/* Set selector */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <label htmlFor="set-select" className="text-gray-400 text-sm whitespace-nowrap">
          Set:
        </label>
        <select
          id="set-select"
          value={selectedSet}
          onChange={(e) => onSetChange(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm min-w-0"
          style={{ maxWidth: 'calc(100vw - 120px)' }}
        >
          {SUPPORTED_SETS.map((set) => (
            <option key={set.code} value={set.code}>
              {set.name} ({set.code})
            </option>
          ))}
        </select>
        <a
          href={get17LandsSetUrl(selectedSet)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap"
        >
          View full data ↗
        </a>
      </div>

      {/* Data timestamp */}
      {dataAsOf && (
        <span className="text-gray-500 text-xs">
          Data as of {new Date(dataAsOf).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
