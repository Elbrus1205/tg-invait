import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        accent: "var(--color-accent)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(34 197 94 / 0.18), 0 16px 40px rgb(2 6 23 / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
