import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F4C81",
          50: "#EAF2FA",
          100: "#CFE2F2",
          400: "#2E6DA6",
          600: "#0F4C81",
          700: "#0C3C67",
          900: "#081F38",
        },
        teal: {
          DEFAULT: "#14B8A6",
          50: "#EDFBF9",
          100: "#CFF5EF",
          400: "#2CCFBC",
          600: "#14B8A6",
          700: "#0E8F81",
        },
        canvas: {
          DEFAULT: "#F8FAFC",
          card: "#F1F5F9",
        },
        navy: {
          DEFAULT: "#0B1220",
          panel: "#111B2E",
          line: "#1E2C44",
        },
        status: {
          good: "#22C55E",
          attn: "#F97316",
          alert: "#EF4444",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        data: ["var(--font-data)", "monospace"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(15, 76, 129, 0.18)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.08)",
        glow: "0 0 60px -10px rgba(20, 184, 166, 0.45)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        ring: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        breathe: "breathe 3.2s ease-in-out infinite",
        ring1: "ring 2.8s ease-out infinite",
        ring2: "ring 2.8s ease-out infinite 0.9s",
        ring3: "ring 2.8s ease-out infinite 1.8s",
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
