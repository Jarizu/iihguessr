"use client";

import { SEVENTEEN_LANDS_HOME } from "@/lib/utils/17lands-urls";

export function Footer() {
  return (
    <footer className="py-4 text-center text-gray-500 text-sm border-t border-gray-800 mt-8">
      <p>
        Data from{" "}
        <a
          href={SEVENTEEN_LANDS_HOME}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          17lands.com
        </a>
        {" | "}
        Images from{" "}
        <a
          href="https://scryfall.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Scryfall
        </a>
      </p>
    </footer>
  );
}
