"use client";

import Image from "next/image";
import { CardDisplay as CardDisplayType } from "@/types";
import { getColorClass } from "@/lib/utils/colors";
import { Metric, METRIC_CONFIG } from "@/lib/metrics";

interface CardDisplayProps {
  card: CardDisplayType;
  isSelected?: boolean;
  result?: "correct" | "incorrect" | null;
  disabled?: boolean;
  onClick?: () => void;
  // When showValue is set, render the value as a colored chip below the card.
  showValue?: number | null;
  metric?: Metric;
}

export function CardDisplay({
  card,
  isSelected = false,
  result = null,
  disabled = false,
  onClick,
  showValue,
  metric,
}: CardDisplayProps) {
  // Color reserved for future use (kept to preserve existing styles via util import).
  getColorClass(card.colors);

  const getBorderClass = () => {
    if (result === "correct") return "ring-4 ring-green-500";
    if (result === "incorrect") return "ring-4 ring-red-500";
    if (isSelected) return "ring-4 ring-blue-500";
    return "ring-2 ring-gray-600 hover:ring-blue-400";
  };

  const cfg = metric ? METRIC_CONFIG[metric] : null;
  // Color logic: for higher-is-better, positive values are "good"; for ALSA,
  // a lower value is good. We just always show neutral coloring in the chip
  // and rely on the result ring for correctness signaling.
  const showChip = showValue !== null && showValue !== undefined && cfg;

  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-200 w-full ${
        disabled ? "cursor-default" : "cursor-pointer"
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className={`relative rounded-lg overflow-hidden ${getBorderClass()} transition-all duration-200 w-full max-w-[244px]`}
      >
        <Image
          src={card.imageUri}
          alt={card.name}
          width={244}
          height={340}
          className="object-cover w-full h-auto"
          priority
        />
        {result && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              result === "correct" ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            <span
              className={`text-3xl sm:text-4xl md:text-6xl ${
                result === "correct" ? "text-green-400" : "text-red-400"
              }`}
            >
              {result === "correct" ? "✓" : "✗"}
            </span>
          </div>
        )}
      </div>

      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-center font-medium text-gray-200 w-full truncate px-1">
        {card.name}
      </p>

      {showChip && (
        <div className="mt-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold bg-gray-800 text-gray-200">
          {cfg!.format(showValue!)} {cfg!.label}
        </div>
      )}
    </div>
  );
}
