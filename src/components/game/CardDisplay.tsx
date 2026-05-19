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
}

export function CardDisplay({
  card,
  isSelected = false,
  result = null,
  disabled = false,
  onClick,
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
    </div>
  );
}
