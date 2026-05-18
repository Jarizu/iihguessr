import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="font-beleren text-5xl bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text text-transparent">
          IIHGuessr
        </h1>

        <p className="text-xl text-neutral-300">
          Train your Magic: The Gathering draft skills by comparing card values
        </p>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-6 text-left space-y-3">
          <h2 className="font-beleren text-lg text-white">How to Play</h2>
          <ol className="text-neutral-400 space-y-2 list-decimal list-inside">
            <li>Pick a set and a stat (IIH, GIH WR, or ALSA)</li>
            <li>Two cards appear side-by-side</li>
            <li>Click the card you think is better by that stat</li>
            <li>See the result and build a streak</li>
          </ol>
        </div>

        <Link
          href="/game"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors font-beleren tracking-wide"
        >
          Start Training
        </Link>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-6 text-left space-y-4">
          <h2 className="font-beleren text-lg text-white">
            The three stats
          </h2>
          <p className="text-neutral-400 text-sm">
            All from <a href="https://www.17lands.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">17lands</a>,
            aggregated from thousands of real Premier Draft games on MTG Arena.
            Comparing cards by these tells you a lot about how a given draft format actually plays out.
          </p>
          <dl className="text-sm space-y-3">
            <div>
              <dt className="font-beleren text-white">IIH — Improvement In Hand</dt>
              <dd className="text-neutral-400 mt-1">
                How much your win rate goes up when you draw this card. Captures the card's marginal value
                <em> beyond</em> what your deck would do without it.
              </dd>
            </div>
            <div>
              <dt className="font-beleren text-white">GIH WR — Games in Hand Win Rate</dt>
              <dd className="text-neutral-400 mt-1">
                Win rate of games where you ever had this card in hand. The most direct "is this card good?" measure,
                but conflates the card's quality with the deck's quality.
              </dd>
            </div>
            <div>
              <dt className="font-beleren text-white">ALSA — Average Last Seen At</dt>
              <dd className="text-neutral-400 mt-1">
                The average pack pick the card is last seen in. Lower = picked earlier = more sought after.
                Reflects what drafters <em>believe</em> about the card, which doesn't always match how it actually performs.
              </dd>
            </div>
          </dl>
          <p className="text-neutral-500 text-xs">
            Want to see how these stats trend across mana value, color, and games played?{" "}
            <Link href="/analytics" className="text-purple-400 hover:text-purple-300 underline">
              Explore the data →
            </Link>
          </p>
        </div>

        <div className="flex gap-4 justify-center text-sm text-neutral-500">
          <Link href="/stats" className="hover:text-neutral-300 transition-colors">
            Your Stats
          </Link>
          <span>|</span>
          <Link href="/review" className="hover:text-neutral-300 transition-colors">
            Review Mistakes
          </Link>
        </div>
      </div>
    </main>
  );
}
