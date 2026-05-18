import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="font-beleren text-5xl bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
          IIHGuessr
        </h1>

        <p className="text-xl text-neutral-300">
          Train your Magic: The Gathering draft skills by comparing card values
        </p>

        <div className="bg-neutral-800/50 rounded-lg p-6 text-left space-y-4">
          <h2 className="font-beleren text-lg text-white">What is IIH?</h2>
          <p className="text-neutral-400">
            <strong className="text-neutral-200">IIH (Improvement In Hand)</strong> measures
            how much a card improves your win rate when you draw it. Data comes from
            17lands.com, aggregated from thousands of real BO1 Premier Draft games on MTG Arena.
          </p>
          <p className="text-neutral-400">
            A card with +5% IIH means drawing it improves your win rate by 5 percentage
            points compared to not drawing it.
          </p>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-6 text-left space-y-4">
          <h2 className="font-beleren text-lg text-white">How to Play</h2>
          <ol className="text-neutral-400 space-y-2 list-decimal list-inside">
            <li>Two cards appear side-by-side</li>
            <li>Click the card you think has higher IIH</li>
            <li>See if you&apos;re right and learn the actual values</li>
            <li>Build streaks and track your accuracy</li>
          </ol>
        </div>

        <Link
          href="/game"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors"
        >
          Start Training
        </Link>

        <div className="flex gap-4 justify-center text-sm text-neutral-500">
          <Link href="/stats" className="hover:text-neutral-300 transition-colors">
            Your Stats
          </Link>
          <span>|</span>
          <Link href="/review" className="hover:text-neutral-300 transition-colors">
            Review Mistakes
          </Link>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-6 text-left space-y-4">
          <h2 className="font-beleren text-lg text-white">
            Understanding IIH Limitations
          </h2>
          <div className="text-neutral-400 space-y-2 text-sm">
            <p>
              <strong className="text-neutral-200">IIH measures correlation, not causation.</strong>{" "}
              This data is from BO1 Premier Draft on MTG Arena and may not apply to BO3 or other formats.
              It&apos;s a powerful metric but has important limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Aggro bias:</strong> Fast decks often win before drawing cards matters,
                giving low-mana-value cards artificially low IIH
              </li>
              <li>
                <strong>Situational cards:</strong> Niche cards (like artifact destruction)
                can have inflated IIH because they&apos;re only played in winning situations
              </li>
              <li>
                <strong>Archetype paradox:</strong> Medium cards in top-tier archetypes may
                have low IIH because the deck wins anyway
              </li>
            </ul>
            <p className="mt-4 space-x-4">
              <Link href="/analytics" className="text-purple-400 hover:text-purple-300 underline">
                View data visualizations →
              </Link>
              <Link href="/learn" className="text-purple-400 hover:text-purple-300 underline">
                Learn more about IIH methodology →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
