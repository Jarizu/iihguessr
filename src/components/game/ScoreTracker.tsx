"use client";

interface ScoreTrackerProps {
  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  total: number;
}

export function ScoreTracker({
  currentStreak,
  bestStreak,
  accuracy,
  total,
}: ScoreTrackerProps) {
  return (
    <div className="flex gap-4 md:gap-6 text-sm">
      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs">Streak</span>
        <span
          className={`font-bold text-lg ${
            currentStreak >= 5
              ? "text-yellow-400"
              : currentStreak >= 3
                ? "text-green-400"
                : "text-gray-200"
          }`}
        >
          {currentStreak}
          {currentStreak >= 10 && " 🔥"}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs">Best</span>
        <span className="font-bold text-lg text-gray-200">{bestStreak}</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs">Accuracy</span>
        <span
          className={`font-bold text-lg ${
            accuracy >= 70
              ? "text-green-400"
              : accuracy >= 50
                ? "text-yellow-400"
                : "text-red-400"
          }`}
        >
          {accuracy.toFixed(0)}%
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs">Total</span>
        <span className="font-bold text-lg text-gray-200">{total}</span>
      </div>
    </div>
  );
}
