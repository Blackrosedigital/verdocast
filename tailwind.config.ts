import type { Config } from "tailwindcss";

/**
 * Tailwind is wired to the Verdocast brand tokens declared in app/globals.css.
 * shadcn/ui semantic colours (primary, secondary, muted, …) are layered on top
 * of the brand palette, so updating a brand token re-themes the whole UI.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // shadcn/ui semantic tokens (see globals.css)
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        input: "var(--input)",
        ring: "var(--ring)",
        // editorial surface scale + faint text (ergonomic aliases of the tokens)
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        faint: "var(--text-faint)",
        gold: "var(--gold)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        // shadcn's "accent" (hover/active surface) maps to our secondary surface,
        // leaving the brand lime free for primary CTAs.
        accent: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        // Verdocast brand palette (raw tokens, per CLAUDE.md)
        brand: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          "surface-2": "var(--surface-2)",
          accent: "var(--accent)",
          "accent-2": "var(--accent-2)",
          gold: "var(--gold)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
