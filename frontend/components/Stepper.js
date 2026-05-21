import { Fragment } from "react";
import { T } from "../theme";

// ─── Journey stepper ──────────────────────────────────────────────────────────
// The 3-step rail naming the whole flow, shared across every page. `active` (1–3)
// marks the current page; earlier steps render as completed (✓), later steps stay
// quiet. Runs on the --hero-* palette, which is defined at :root so the rail looks
// right whether it sits on a hero surface or a plain page.
const STEPS = [
  { n: 1, label: "Select dataset" },
  { n: 2, label: "Compare RAG setups" },
  { n: 3, label: "Trace root cause" },
];

export function Stepper({ active = 1, className, style }) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "nowrap",
        gap: "8px",
        ...style,
      }}
    >
      {STEPS.map((s, i) => {
        const isActive = s.n === active;
        const isDone = s.n < active;
        return (
          <Fragment key={s.n}>
            {i > 0 && (
              <span style={{ width: "18px", height: "1.5px", background: "var(--hero-step-line)", flexShrink: 0 }} aria-hidden />
            )}
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "21px",
                height: "21px",
                borderRadius: T.radius.pill,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.68rem",
                fontWeight: 700,
                flexShrink: 0,
                background: isActive ? "var(--hero-accent)" : "transparent",
                color: isActive
                  ? "var(--hero-accent-ink)"
                  : isDone ? "var(--hero-accent)" : "var(--hero-ink-faint)",
                border: isActive
                  ? "none"
                  : `1.5px solid ${isDone ? "var(--hero-accent)" : "var(--hero-border-strong)"}`,
                boxShadow: isActive ? "0 0 15px 1px var(--hero-accent-glow)" : "none",
              }}>
                {isDone ? "✓" : s.n}
              </span>
              <span
                className={isActive ? undefined : "hero-step-rest"}
                style={{
                  fontSize: "0.83rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? "var(--hero-ink)"
                    : isDone ? "var(--hero-ink-soft)" : "var(--hero-ink-faint)",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
