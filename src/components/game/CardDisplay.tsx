"use client";

import Image from "next/image";
import { CardDisplay as CardDisplayType } from "@/types";
import { getColorClass } from "@/lib/utils/colors";

interface CardDisplayProps {
  card: CardDisplayType;
  isSelected?: boolean;
  result?: "correct" | "incorrect" | null;
  disabled?: boolean;
  onClick?: () => void;
  showIwd?: number | null;
}

export function CardDisplay({
  card,
  isSelected = false,
  result = null,
  disabled = false,
  onClick,
  showIwd,
}: CardDisplayProps) {
  const colorClass = getColorClass(card.colors);

  const getBorderClass = () => {
    if (result === "correct") return "ring-4 ring-green-500";
    if (result === "incorrect") return "ring-4 ring-red-500";
    if (isSelected) return "ring-4 ring-blue-500";
    return "ring-2 ring-gray-600 hover:ring-blue-400";
  };

  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-200 w-full ${
        disabled ? "cursor-default" : "cursor-pointer"
      }`}
      onClick={disabled ? undefined : onClick}
    >
      {/* Card image */}
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

        {/* Result overlay */}
        {result && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              result === "correct"
                ? "bg-green-500/20"
                : "bg-red-500/20"
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

      {/* Card name */}
      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-center font-medium text-gray-200 w-full truncate px-1">
        {card.name}
      </p>

      {/* IWD value (shown after reveal) */}
      {showIwd !== null && showIwd !== undefined && (
        <div
          className={`mt-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold ${
            showIwd >= 0 ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
          }`}
        >
          {showIwd >= 0 ? "+" : ""}
          {(showIwd * 100).toFixed(1)}% IWD
        </div>
      )}
    </div>
  );
}
