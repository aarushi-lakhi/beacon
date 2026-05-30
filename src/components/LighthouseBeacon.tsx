"use client";

interface Props {
  size?: number;
}

export default function LighthouseBeacon({ size = 44 }: Props) {
  const height = Math.round(size * 54 / 40);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height }}>
      {/* Rotating beam — conic gradient sweeping around the light source */}
      <div
        className="absolute inset-0 animate-beam-sweep"
        style={{
          background: `conic-gradient(
            from 0deg at 50% 11%,
            transparent 0deg,
            rgba(245,158,11,0.06) 18deg,
            rgba(245,158,11,0.32) 27deg,
            rgba(255,251,230,0.50) 33deg,
            rgba(245,158,11,0.32) 39deg,
            rgba(245,158,11,0.06) 50deg,
            transparent 58deg,
            transparent 360deg
          )`,
          transformOrigin: "50% 11%",
        }}
      />
      {/* Pulsing amber glow at the light source */}
      <div
        className="absolute inset-0 animate-light-pulse"
        style={{
          background:
            "radial-gradient(ellipse 65% 32% at 50% 11%, rgba(245,158,11,0.95) 0%, rgba(245,158,11,0.18) 45%, transparent 70%)",
        }}
      />
      {/* Lighthouse SVG — sits on top so the beam sweeps behind it */}
      <svg
        viewBox="0 0 40 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height, position: "relative", zIndex: 1 }}
        aria-label="Beacon lighthouse icon"
      >
        {/* Tower body (trapezoid — wider at base) */}
        <path d="M15 16L25 16L28 50L12 50Z" fill="#eddfc8" />
        {/* Amber horizontal stripe */}
        <path d="M12.2 30L27.8 30L28.0 35L12.0 35Z" fill="#d97706" />
        {/* Arched door */}
        <rect x="17.5" y="42" width="5" height="8" rx="2.5" fill="#d97706" />
        {/* Lantern room */}
        <rect x="13" y="10" width="14" height="5" rx="1.5" fill="#0c0b14" />
        {/* Viewing platform railing */}
        <rect x="11" y="14.5" width="18" height="1.5" rx="0.75" fill="#0c0b14" />
        {/* Base platform */}
        <rect x="9" y="50" width="22" height="4" rx="1.5" fill="#0c0b14" />
        {/* Light — soft outer glow */}
        <circle cx="20" cy="6" r="6.5" fill="#f59e0b" fillOpacity="0.22" />
        {/* Light — main orb */}
        <circle cx="20" cy="6" r="4" fill="#f59e0b" />
        {/* Light — bright center */}
        <circle cx="20" cy="6" r="2" fill="#fffdf8" />
      </svg>
    </div>
  );
}
