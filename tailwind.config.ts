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
          navy: "#0f1629",
          "navy-light": "#1a2540",
          blue: "#1a56db",
          teal: "#0694a2",
          glow: "#3b82f6",
        },
        status: {
          ready: "#057a55",
          "ready-bg": "#def7ec",
          "ready-text": "#014737",
          risk: "#92400e",
          "risk-bg": "#fef3c7",
          "risk-text": "#78350f",
          blocked: "#9b1c1c",
          "blocked-bg": "#fee2e2",
          "blocked-text": "#7f1d1d",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
