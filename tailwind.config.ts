import type { Config } from "tailwindcss";

/**
 * Custom purple ramp built around #5b0dd1 (HSL 263°, 88%, 44%).
 * Used everywhere the codebase says `purple-*`.
 */
const purple = {
  50: "#f3ebff",
  100: "#e3d1ff",
  200: "#c9a8ff",
  300: "#a878ff",
  400: "#864bff",
  500: "#6f22e8",
  600: "#5b0dd1",
  700: "#4a0baa",
  800: "#370883",
  900: "#240554",
  950: "#15032f",
};

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        purple,
      },
    },
  },
  plugins: [],
} satisfies Config;
