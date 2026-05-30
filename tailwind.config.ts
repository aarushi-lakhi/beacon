import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beacon: {
          ivory:        "#fffdf8",
          cream:        "#faf6ed",
          50:           "#fffbeb",
          100:          "#fef3c7",
          200:          "#fde68a",
          500:          "#f59e0b",
          600:          "#d97706",
          700:          "#b45309",
          900:          "#78350f",
          navy:         "#0c0b14",
          "navy-mid":   "#1a1830",
          "navy-light": "#2d2a45",
          glow:         "#fcd34d",
        },
        status: {
          ready:          "#059669",
          "ready-bg":     "#ecfdf5",
          "ready-ring":   "#6ee7b7",
          "ready-text":   "#064e3b",
          risk:           "#d97706",
          "risk-bg":      "#fffbeb",
          "risk-ring":    "#fcd34d",
          "risk-text":    "#78350f",
          blocked:        "#dc2626",
          "blocked-bg":   "#fef2f2",
          "blocked-ring": "#fca5a5",
          "blocked-text": "#7f1d1d",
        },
        surface: {
          50:  "#faf6ed",
          100: "#f0e8d5",
          200: "#e4d5bc",
          300: "#cdbfa4",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        card:           "0 1px 4px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover":   "0 4px 16px 0 rgb(0 0 0 / 0.09), 0 2px 4px -1px rgb(0 0 0 / 0.05)",
        glow:           "0 0 20px rgb(217 119 6 / 0.45)",
        "glow-sm":      "0 0 10px rgb(217 119 6 / 0.3)",
        "amber-glow":   "0 0 28px rgb(245 158 11 / 0.55)",
        "ready-glow":   "0 0 12px rgb(5 150 105 / 0.3)",
        "risk-glow":    "0 0 12px rgb(217 119 6 / 0.3)",
        "blocked-glow": "0 0 12px rgb(220 38 38 / 0.3)",
      },
      animation: {
        "fade-up":    "fadeUp 0.4s ease-out forwards",
        "fade-in":    "fadeIn 0.3s ease-out forwards",
        "slide-right":"slideRight 0.35s ease-out forwards",
        "status-ping":"statusPing 2s ease-out infinite",
        "float":      "float 4s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
        "beam-sweep": "beamSweep 3s linear infinite",
        "light-pulse":"lightPulse 2.8s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        statusPing: {
          "0%":        { transform: "scale(1)", opacity: "1" },
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-5px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        beamSweep: {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        lightPulse: {
          "0%, 100%": { opacity: "0.2" },
          "50%":      { opacity: "0.9" },
        },
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
      },
    },
  },
  plugins: [],
};

export default config;
