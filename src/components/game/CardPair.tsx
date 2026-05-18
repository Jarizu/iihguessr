"use client";

import { CardDisplay as CardDisplayType } from "@/types";
import { CardDisplay } from "./CardDisplay";
import { Metric } from "@/lib/metrics";

interface CardPairProps {
  cardA: CardDisplayType;
  cardB: CardDisplayType;
  selectedCardId: string | null;
  resultA?: "correct" | "incorrect" | null;
  resultB?: "correct" | "incorrect" | null;
  disabled?: boolean;
  onSelect: (cardId: string) => void;
  valueA?: number | null;
  valueB?: number | null;
  metric?: Metric;
}

export function CardPair({
  cardA,
  cardB,
  selectedCardId,
  resultA = null,
  resultB = null,
  disabled = false,
  onSelect,
  valueA = null,
  valueB = null,
  metric,
}: CardPairProps) {
  return (
    <div className="flex flex-row gap-2 sm:gap-4 md:gap-8 items-start justify-center w-full px-2 sm:px-0">
      <div className="flex flex-col items-center flex-1 min-w-0 max-w-[45vw] sm:max-w-none">
        <CardDisplay
          card={cardA}
          isSelected={selectedCardId === cardA.id}
          result={resultA}
          disabled={disabled}
          onClick={() => onSelect(cardA.id)}
          showValue={valueA}
          metric={metric}
        />
        <span className="hidden md:block text-neutral-500 text-xs mt-2">
          Press 1 or click
        </span>
      </div>

      <div className="flex items-center pt-16 sm:pt-20 md:pt-32">
        <span className="text-xl sm:text-2xl font-bold text-neutral-500">VS</span>
      </div>

      <div className="flex flex-col items-center flex-1 min-w-0 max-w-[45vw] sm:max-w-none">
        <CardDisplay
          card={cardB}
          isSelected={selectedCardId === cardB.id}
          result={resultB}
          disabled={disabled}
          onClick={() => onSelect(cardB.id)}
          showValue={valueB}
          metric={metric}
        />
        <span className="hidden md:block text-neutral-500 text-xs mt-2">
          Press 2 or click
        </span>
      </div>
    </div>
  );
}
