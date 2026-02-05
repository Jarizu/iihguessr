/**
 * Check if two cards share at least one color
 */
export function hasColorOverlap(colorsA: string[], colorsB: string[]): boolean {
  // Colorless cards match with anything
  if (colorsA.length === 0 || colorsB.length === 0) {
    return true;
  }
  return colorsA.some((c) => colorsB.includes(c));
}

/**
 * Get a CSS class name based on card colors
 */
export function getColorClass(colors: string[]): string {
  if (colors.length === 0) return "card-colorless";
  if (colors.length > 1) return "card-multicolor";

  const colorMap: Record<string, string> = {
    W: "card-white",
    U: "card-blue",
    B: "card-black",
    R: "card-red",
    G: "card-green",
  };

  return colorMap[colors[0]] || "card-colorless";
}

/**
 * Get display name for a color combination
 */
export function getColorName(colors: string[]): string {
  if (colors.length === 0) return "Colorless";
  if (colors.length > 2) return "Multicolor";

  const colorNames: Record<string, string> = {
    W: "White",
    U: "Blue",
    B: "Black",
    R: "Red",
    G: "Green",
  };

  return colors.map((c) => colorNames[c] || c).join("/");
}

/**
 * Parse colors from JSON string (stored in DB)
 */
export function parseColors(colorsJson: string): string[] {
  try {
    return JSON.parse(colorsJson);
  } catch {
    return [];
  }
}
