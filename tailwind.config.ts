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
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
          navy: "#0c1220",
          "navy-mid": "#111827",
          "navy-light": "#1f2937",
          glow: "#60a5fa",
        },
        status: {
          ready:         "#059669",
          "ready-bg":    "#ecfdf5",
          "ready-ring":  "#6ee7b7",
          "ready-text":  "#064e3b",
          risk:          "#d97706",
          "risk-bg":     "#fffbeb",
          "risk-ring":   "#fcd34d",
          "risk-text":   "#78350f",
          blocked:       "#dc2626",
          "blocked-bg":  "#fef2f2",
          "blocked-ring":"#fca5a5",
          "blocked-text":"#7f1d1d",
        },
        surface: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.06)",
        glow: "0 0 20px rgb(59 130 246 / 0.35)",
        "glow-sm": "0 0 10px rgb(59 130 246 / 0.25)",
        "ready-glow": "0 0 12px rgb(5 150 105 / 0.3)",
        "risk-glow": "0 0 12px rgb(217 119 6 / 0.3)",
        "blocked-glow": "0 0 12px rgb(220 38 38 / 0.3)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-right": "slideRight 0.35s ease-out forwards",
        "pulse-beacon": "pulseBeacon 2s ease-in-out infinite",
        "flow": "flow 3s ease-in-out infinite",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "count-up": "countUp 0.8s ease-out forwards",
        "status-ping": "statusPing 2s ease-out infinite",
        "agent-active": "agentActive 1.5s ease-in-out infinite",
        "progress-fill": "progressFill 1.2s ease-out forwards",
        "dash": "dash 0.6s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseBeacon: {
          "0%, 100%": { boxShadow: "0 0 8px rgb(59 130 246 / 0.4)" },
          "50%": { boxShadow: "0 0 24px rgb(59 130 246 / 0.8)" },
        },
        flow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        statusPing: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        agentActive: {
          "0%, 100%": { borderColor: "rgb(59 130 246 / 0.4)" },
          "50%": { borderColor: "rgb(59 130 246 / 1)" },
        },
        progressFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--target-width)" },
        },
        dash: {
          "0%": { opacity: "0", strokeDashoffset: "100" },
          "100%": { opacity: "1", strokeDashoffset: "0" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
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
