import { memo } from "react";

// ─── Hero backdrop ────────────────────────────────────────────────────────────
// Soft spring mood for the homepage hero, built from CSS gradients and inline
// SVG so it stays responsive and re-themes through the --hero-* custom
// properties in globals.css. Purely decorative: the whole layer is aria-hidden,
// non-interactive, and sits behind the hero content via z-index.

// Sakura petal: tip up, soft notch at the base.
const PETAL_PATH =
  "M10 1 C 4 6 1.6 13 5 19 C 6.5 21.5 8.3 21.8 10 19.4 C 11.7 21.8 13.5 21.5 15 19 C 18.4 13 16 6 10 1 Z";
// Four-point twinkle.
const SPARK_PATH =
  "M8 0 C 8.7 4.6 11.4 7.3 16 8 C 11.4 8.7 8.7 11.4 8 16 C 7.3 11.4 4.6 8.7 0 8 C 4.6 7.3 7.3 4.6 8 0 Z";

// Sparse petals, kept clear of the centred content column. `sm` petals survive
// on small screens; the rest are dropped via .hero-petal--hide-sm.
const PETALS = [
  { x: "8%",  y: "20%", s: 28, hue: "a", rot: "-20deg", dx: "26px",  dy: "40px",  spin: "22deg",  dur: "14s", delay: "-2s",  op: 0.85, sm: true },
  { x: "15%", y: "44%", s: 19, hue: "b", rot: "26deg",  dx: "-22px", dy: "34px",  spin: "-26deg", dur: "17s", delay: "-7s",  op: 0.6,  sm: false },
  { x: "11%", y: "67%", s: 23, hue: "a", rot: "8deg",   dx: "30px",  dy: "-30px", spin: "18deg",  dur: "15s", delay: "-4s",  op: 0.72, sm: false },
  { x: "18%", y: "87%", s: 17, hue: "b", rot: "-34deg", dx: "20px",  dy: "-26px", spin: "-20deg", dur: "19s", delay: "-9s",  op: 0.58, sm: true },
  { x: "90%", y: "17%", s: 21, hue: "b", rot: "30deg",  dx: "-24px", dy: "36px",  spin: "-24deg", dur: "16s", delay: "-3s",  op: 0.72, sm: true },
  { x: "84%", y: "42%", s: 26, hue: "a", rot: "-14deg", dx: "26px",  dy: "30px",  spin: "20deg",  dur: "13s", delay: "-8s",  op: 0.82, sm: false },
  { x: "91%", y: "64%", s: 16, hue: "b", rot: "18deg",  dx: "-20px", dy: "-28px", spin: "-18deg", dur: "18s", delay: "-5s",  op: 0.58, sm: false },
  { x: "80%", y: "86%", s: 22, hue: "a", rot: "-26deg", dx: "-28px", dy: "-32px", spin: "24deg",  dur: "15s", delay: "-11s", op: 0.7,  sm: true },
];

const SPARKLES = [
  { x: "25%", y: "30%", s: 15, dur: "3.4s", delay: "-0.4s", lo: 0.5,  hi: 1,    sm: true },
  { x: "76%", y: "28%", s: 12, dur: "4.6s", delay: "-2.1s", lo: 0.4,  hi: 0.92, sm: false },
  { x: "72%", y: "73%", s: 13, dur: "3.9s", delay: "-1.3s", lo: 0.5,  hi: 1,    sm: true },
  { x: "23%", y: "61%", s: 10, dur: "5.2s", delay: "-3.0s", lo: 0.35, hi: 0.85, sm: false },
  { x: "79%", y: "50%", s: 11, dur: "4.2s", delay: "-2.6s", lo: 0.45, hi: 0.95, sm: true },
];

function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Soft radial wash: lifts the top centre toward the moon. */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(128% 80% at 50% 6%, var(--hero-bg-lift), transparent 58%)",
      }} />

      {/* Grain texture: one small procedural noise tile (SVG turbulence)
          repeated via <pattern> so it stays cheap to render. No image asset.
          Black speckle (darken-only) so it never greys the dark theme. */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: "var(--hero-grain)",
        }}
      >
        <defs>
          <filter id="heroGrainFilter" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" stitchTiles="stitch" seed="11" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
          </filter>
          <pattern id="heroGrainTile" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect width="200" height="200" filter="url(#heroGrainFilter)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heroGrainTile)" />
      </svg>

      {/* Dotted grid, faded out behind the headline so it never fights text. */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(var(--hero-grid) 1.1px, transparent 1.2px)",
        backgroundSize: "27px 27px",
        backgroundPosition: "center",
        WebkitMaskImage: "radial-gradient(ellipse 56% 50% at 50% 44%, transparent 8%, #000 76%)",
        maskImage: "radial-gradient(ellipse 56% 50% at 50% 44%, transparent 8%, #000 76%)",
      }} />

      {/* Drifting petals. */}
      {PETALS.map((p, i) => (
        <div
          key={"p" + i}
          className={"hero-petal" + (p.sm ? "" : " hero-petal--hide-sm")}
          style={{
            position: "absolute",
            left: p.x, top: p.y,
            width: p.s, height: p.s * 1.2,
            opacity: p.op,
            animationDelay: p.delay,
            "--p-rot": p.rot,
            "--p-dx": p.dx,
            "--p-dy": p.dy,
            "--p-spin": p.spin,
            "--p-dur": p.dur,
          }}
        >
          <svg viewBox="0 0 20 24" width="100%" height="100%" fill={"var(--hero-petal-" + p.hue + ")"}>
            <path d={PETAL_PATH} />
          </svg>
        </div>
      ))}

      {/* Twinkling sparkles. */}
      {SPARKLES.map((s, i) => (
        <div
          key={"s" + i}
          className={"hero-spark" + (s.sm ? "" : " hero-spark--hide-sm")}
          style={{
            position: "absolute",
            left: s.x, top: s.y,
            width: s.s, height: s.s,
            animationDelay: s.delay,
            "--tw-dur": s.dur,
            "--tw-lo": s.lo,
            "--tw-hi": s.hi,
          }}
        >
          <svg viewBox="0 0 16 16" width="100%" height="100%" fill="var(--hero-spark)">
            <path d={SPARK_PATH} />
          </svg>
        </div>
      ))}
    </div>
  );
}

export default memo(HeroBackground);
