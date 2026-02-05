import { GameBoard } from "@/components/game/GameBoard";
import Link from "next/link";

export default function GamePage() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300">
            IIHGuessr
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/stats" className="text-gray-400 hover:text-gray-200">
              Stats
            </Link>
            <Link href="/review" className="text-gray-400 hover:text-gray-200">
              Review
            </Link>
          </div>
        </nav>

        {/* Game */}
        <GameBoard />
      </div>
    </main>
  );
}
