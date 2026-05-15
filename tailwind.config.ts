import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        xroads: {
          50: "#f4faeb",
          100: "#e5f4d0",
          200: "#cdeaa6",
          300: "#adda72",
          400: "#94cb47",
          500: "#7eb928",
          600: "#63931d",
          700: "#4d711b",
          800: "#405a1c",
          900: "#374d1d",
          950: "#1a2a0a",
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
