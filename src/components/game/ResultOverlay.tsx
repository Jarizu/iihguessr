"use client";

import { GuessResponse } from "@/types";
import { getScryfallCardUrl } from "@/lib/utils/17lands-urls";

interface ResultOverlayProps {
  result: GuessResponse;
  onNext: () => void;
}

export function ResultOverlay({ result, onNext }: ResultOverlayProps) {
  const formatIwd = (iih: number) => {
    const percentage = iih * 100;
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const formatGihWr = (gihWr: number) => {
    return `${(gihWr * 100).toFixed(1)}%`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3 md:p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto">
        {/* Result status and button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          {/* Result status */}
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl ${
                result.isCorrect ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.isCorrect ? "✓" : "✗"}
            </span>
            <span
              className={`text-lg font-bold ${
                result.isCorrect ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.isCorrect ? "Correct!" : "Incorrect"}
            </span>
          </div>

          {/* Next button */}
          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Next →
          </button>
        </div>

        {/* GIH WR comparison with clickable card names - centered */}
        <div className="flex items-start justify-center gap-3 text-xs sm:text-sm mb-2">
          <div className="text-center flex-1 max-w-[40%]">
            <a
              href={getScryfallCardUrl(result.cardAScryfallId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-semibold"
            >
              {result.cardAName}
            </a>
            <p className="text-gray-500 text-xs mt-1">
              {formatGihWr(result.cardAGihWr)} GIH WR
            </p>
          </div>
          <span className="text-gray-500 flex-shrink-0 pt-0.5">vs</span>
          <div className="text-center flex-1 max-w-[40%]">
            <a
              href={getScryfallCardUrl(result.cardBScryfallId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-semibold"
            >
              {result.cardBName}
            </a>
            <p className="text-gray-500 text-xs mt-1">
              {formatGihWr(result.cardBGihWr)} GIH WR
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs">
          <span className="hidden sm:inline">Press Enter or Space to continue</span>
          <span className="sm:hidden">Tap Next to continue</span>
        </p>
      </div>
    </div>
  );
}
