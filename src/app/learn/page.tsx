import Link from "next/link";

export default function LearnPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 mb-6 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Understanding IWD (Improvement When Drawn)
        </h1>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-200">What is IWD?</h2>
          <p className="text-gray-400">
            <strong className="text-gray-200">IWD (Improvement When Drawn)</strong> is a
            statistical metric developed by 17lands.com that measures how much a card
            improves your win rate when you draw it during a game.
          </p>
          <p className="text-gray-400">
            Mathematically, IWD is calculated as:{" "}
            <code className="bg-gray-800 px-2 py-1 rounded text-sm">
              IWD = Win Rate (when drawn) - Win Rate (when not drawn)
            </code>
          </p>
          <p className="text-gray-400">
            For example, a card with <strong className="text-green-400">+5% IWD</strong>{" "}
            means that games where you drew that card had a 5 percentage point higher win
            rate compared to games where you didn&apos;t draw it (but it was in your deck).
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-gray-300 text-sm">
              <strong>Important:</strong> IWD measures <em>correlation</em>, not{" "}
              <em>causation</em>. A high IWD doesn&apos;t necessarily mean the card{" "}
              <em>caused</em> you to win - it could mean you were already winning when you
              drew it.
            </p>
          </div>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-200">
            IWD Limitations & Biases
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-5 border border-gray-700">
              <h3 className="text-xl font-semibold text-gray-200 mb-3">
                1. Aggro Bias
              </h3>
              <p className="text-gray-400 mb-2">
                Fast, aggressive decks often win or lose before drawing many cards matters.
                This gives aggro cards artificially low IWD values.
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-300">Example:</strong> A 2-mana 2/2 creature
                might have low IWD not because it&apos;s bad, but because aggro decks win
                quickly (before drawing it matters) or lose quickly (making it irrelevant).
                The games where it gets drawn often end before its impact can be measured.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-5 border border-gray-700">
              <h3 className="text-xl font-semibold text-gray-200 mb-3">
                2. Situational Cards (Sideboard Effect)
              </h3>
              <p className="text-gray-400 mb-2">
                Niche cards that are only good in specific matchups can have inflated IWD
                because they&apos;re primarily played when they&apos;re likely to be
                effective.
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-300">Example:</strong> Artifact or enchantment
                destruction cards might show high IWD because players sideboard them in
                against artifact/enchantment-heavy decks where they&apos;re strong.
                They&apos;re rarely in losing matchups, inflating their correlation with
                winning.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-5 border border-gray-700">
              <h3 className="text-xl font-semibold text-gray-200 mb-3">
                3. Archetype Paradox
              </h3>
              <p className="text-gray-400 mb-2">
                Medium-quality cards in dominant archetypes can have low IWD because the
                deck wins regardless of whether you draw specific cards.
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-300">Example:</strong> If Blue-White fliers is
                the best archetype in a format, a mediocre flier might have low IWD not
                because it&apos;s weak, but because the deck is so strong that drawing any
                particular card doesn&apos;t significantly change the outcome.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-5 border border-gray-700">
              <h3 className="text-xl font-semibold text-gray-200 mb-3">
                4. Context & Sample Size
              </h3>
              <p className="text-gray-400 mb-2">
                IWD is based on aggregated data from thousands of games. The metagame,
                format speed, and player skill level all affect the numbers.
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-300">Considerations:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-400 ml-4 space-y-1">
                <li>Rare cards have smaller sample sizes than commons</li>
                <li>Early format data can be less reliable as the meta evolves</li>
                <li>Flashback drafts may have different dynamics than new releases</li>
                <li>17lands data comes from enfranchised players, not casual players</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-200">GIH WR vs IWD</h2>
          <p className="text-gray-400">
            This app also displays{" "}
            <strong className="text-gray-200">GIH WR (Games In Hand Win Rate)</strong>,
            which is the win rate when a card is in your opening hand.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">IWD</h3>
              <p className="text-gray-400 text-sm">
                Measures the <em>improvement</em> from drawing a card during the game.
                Better for evaluating late-game impact and card quality in a vacuum.
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">GIH WR</h3>
              <p className="text-gray-400 text-sm">
                Measures the <em>absolute</em> win rate with the card in your opening hand.
                Better for evaluating overall deck strength and early-game impact.
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Comparing both metrics gives you a more complete picture of a card&apos;s value.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-200">Learn More</h2>
          <p className="text-gray-400">
            All data in IIHGuessr comes from{" "}
            <a
              href="https://www.17lands.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              17lands.com
            </a>
            , an incredible resource for Limited Magic data and analysis.
          </p>
          <p className="text-gray-400">
            For more details on their methodology, visit the{" "}
            <a
              href="https://www.17lands.com/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              17lands metrics page
            </a>
            .
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <Link
            href="/game"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start Playing →
          </Link>
        </div>
      </div>
    </main>
  );
}
