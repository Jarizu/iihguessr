"use client";

import { get17LandsSetUrl } from "@/lib/utils/17lands-urls";

interface SetOption {
  code: string;
  name: string;
}

interface SetSelectorProps {
  sets: SetOption[];
  selectedSet: string | null;
  onSetChange: (setCode: string) => void;
  dataAsOf?: string;
}

export function SetSelector({
  sets,
  selectedSet,
  onSetChange,
  dataAsOf,
}: SetSelectorProps) {
  return (
    <div className="flex flex-col gap-2 items-start w-full sm:w-auto">
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <label
          htmlFor="set-select"
          className="text-neutral-400 text-sm whitespace-nowrap"
        >
          Set:
        </label>
        <select
          id="set-select"
          value={selectedSet ?? ""}
          onChange={(e) => onSetChange(e.target.value)}
          disabled={sets.length === 0}
          className="bg-neutral-900 text-white border border-neutral-700 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs sm:text-sm min-w-0"
          style={{ maxWidth: "calc(100vw - 120px)" }}
        >
          {sets.length === 0 && <option value="">Loading...</option>}
          {sets.map((set) => (
            <option key={set.code} value={set.code}>
              {set.name} ({set.code.toUpperCase()})
            </option>
          ))}
        </select>
        {selectedSet && (
          <a
            href={get17LandsSetUrl(selectedSet)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-xs whitespace-nowrap"
          >
            View full data ↗
          </a>
        )}
      </div>

      {dataAsOf && (
        <span className="text-neutral-500 text-xs">
          Data as of {new Date(dataAsOf).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
