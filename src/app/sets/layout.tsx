import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Rankings - IIHGuessr",
  description:
    "Crowdsourced rankings of how fun every Magic: The Gathering set is to draft.",
};

export default function SetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
