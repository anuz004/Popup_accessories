import { motion } from "framer-motion";
import type { WatchStyle } from "@/data/products";

interface WatchArtProps {
  style: WatchStyle;
  caseColor: string;
  dialColor: string;
  accent?: string;
  animated?: boolean;
  className?: string;
}

/**
 * An original, hand-drawn SVG watch illustration used in place of stock
 * photography throughout the site — keeps every product visual unique to
 * this brand and lets the seconds hand tick in real time.
 */
export function WatchArt({
  style,
  caseColor,
  dialColor,
  accent = "#D4AF37",
  animated = true,
  className = "",
}: WatchArtProps) {
  const gradId = `case-${caseColor.replace("#", "")}-${style}`;
  const dialGradId = `dial-${dialColor.replace("#", "")}-${style}`;

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={lighten(caseColor, 30)} />
          <stop offset="55%" stopColor={caseColor} />
          <stop offset="100%" stopColor={darken(caseColor, 25)} />
        </radialGradient>
        <radialGradient id={dialGradId} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={lighten(dialColor, 12)} />
          <stop offset="100%" stopColor={darken(dialColor, 8)} />
        </radialGradient>
        <filter id="watchShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* Lugs */}
      <g fill={darken(caseColor, 15)}>
        <rect x="150" y="18" width="100" height="40" rx="10" />
        <rect x="150" y="342" width="100" height="40" rx="10" />
      </g>

      {/* Crown */}
      <rect x="378" y="182" width="20" height="36" rx="5" fill={darken(caseColor, 10)} />

      {/* Case */}
      <circle cx="200" cy="200" r="170" fill={`url(#${gradId})`} filter="url(#watchShadow)" />
      <circle cx="200" cy="200" r="170" fill="none" stroke={darken(caseColor, 35)} strokeWidth="2" opacity="0.5" />

      {/* Bezel */}
      <circle cx="200" cy="200" r="152" fill="none" stroke={darken(caseColor, 20)} strokeWidth="10" />
      {style === "diamond" &&
        Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const r = 152;
          return (
            <circle
              key={i}
              cx={200 + Math.cos(angle) * r}
              cy={200 + Math.sin(angle) * r}
              r="4"
              fill="#F5F5F5"
              opacity="0.9"
            />
          );
        })}
      {style === "sport" && (
        <circle cx="200" cy="200" r="152" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="2 10" opacity="0.6" />
      )}

      {/* Dial */}
      <circle cx="200" cy="200" r="138" fill={`url(#${dialGradId})`} />
      {style === "smart" && (
        <>
          <circle cx="200" cy="200" r="138" fill="#04110c" opacity="0.4" />
          <rect x="150" y="150" width="100" height="26" rx="6" fill={accent} opacity="0.12" />
        </>
      )}

      {/* Minute track */}
      <g stroke={style === "classic" || style === "diamond" ? accent : "#B8B8B8"} strokeWidth="1" opacity="0.55">
        {Array.from({ length: 60 }).map((_, i) => {
          if (i % 5 === 0) return null;
          const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
          const r1 = 132;
          const r2 = 126;
          return (
            <line
              key={i}
              x1={200 + Math.cos(angle) * r1}
              y1={200 + Math.sin(angle) * r1}
              x2={200 + Math.cos(angle) * r2}
              y2={200 + Math.sin(angle) * r2}
            />
          );
        })}
      </g>

      {/* Hour indices */}
      <g>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const r = 112;
          const x = 200 + Math.cos(angle) * r;
          const y = 200 + Math.sin(angle) * r;
          if (style === "classic" && i % 3 === 0) {
            return (
              <text
                key={i}
                x={x}
                y={y + 8}
                textAnchor="middle"
                fontSize="22"
                fontFamily="Playfair Display, serif"
                fill={accent}
              >
                {["XII", "III", "VI", "IX"][i / 3]}
              </text>
            );
          }
          return (
            <rect
              key={i}
              x={x - 3}
              y={y - (i % 3 === 0 ? 14 : 9)}
              width="6"
              height={i % 3 === 0 ? 28 : 18}
              rx="2"
              fill={i % 3 === 0 ? accent : "#B8B8B8"}
              opacity={i % 3 === 0 ? 1 : 0.75}
              transform={`rotate(${(i / 12) * 360} ${x} ${y})`}
            />
          );
        })}
      </g>

      {/* Sub-dial for sport style */}
      {style === "sport" && (
        <>
          <circle cx="150" cy="200" r="26" fill="none" stroke="#B8B8B8" strokeWidth="1.5" opacity="0.5" />
          <circle cx="250" cy="200" r="26" fill="none" stroke="#B8B8B8" strokeWidth="1.5" opacity="0.5" />
          <circle cx="200" cy="255" r="22" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7" />
        </>
      )}

      {/* Brand wordmark on dial */}
      <text
        x="200"
        y="150"
        textAnchor="middle"
        fontSize="12"
        letterSpacing="3"
        fontFamily="Playfair Display, serif"
        fill={style === "classic" || style === "minimal" ? "#0F0F10" : accent}
        opacity="0.85"
      >
        POPUP
      </text>

      {/* Date window */}
      {style !== "diamond" && (
        <g>
          <rect x="228" y="192" width="22" height="16" rx="2" fill="#EDEDED" />
          <text x="239" y="204" textAnchor="middle" fontSize="10" fontFamily="Inter, sans-serif" fill="#0F0F10">
            24
          </text>
        </g>
      )}

      {/* Hands */}
      <g>
        <motion.line
          x1="200"
          y1="200"
          x2="200"
          y2="130"
          stroke={style === "classic" || style === "diamond" ? accent : "#FFFFFF"}
          strokeWidth="6"
          strokeLinecap="round"
          animate={animated ? { rotate: 360 } : undefined}
          transition={{ duration: 43200, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px", rotate: 65 }}
        />
        <motion.line
          x1="200"
          y1="200"
          x2="200"
          y2="90"
          stroke={style === "classic" || style === "diamond" ? accent : "#FFFFFF"}
          strokeWidth="4"
          strokeLinecap="round"
          animate={animated ? { rotate: 360 } : undefined}
          transition={{ duration: 3600, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px", rotate: 210 }}
        />
        <motion.line
          x1="200"
          y1="215"
          x2="200"
          y2="80"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={animated ? { rotate: 360 } : undefined}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        />
        <circle cx="200" cy="200" r="7" fill={accent} />
      </g>

      {/* Crystal glare */}
      <ellipse cx="150" cy="130" rx="60" ry="30" fill="#FFFFFF" opacity="0.06" />
    </svg>
  );
}

function darken(hex: string, amt: number) {
  return shade(hex, -amt);
}
function lighten(hex: string, amt: number) {
  return shade(hex, amt);
}
function shade(hex: string, amt: number) {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0x00ff) + amt;
  let b = (num & 0x0000ff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
