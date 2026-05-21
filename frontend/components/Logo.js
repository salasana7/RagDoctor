import { useState, useEffect } from "react";
import { T } from "../theme";

// ─── GitHub star count ────────────────────────────────────────────────────────
const GH_REPO = "hanhanwu/RagDoctor";

export function GitHubStars() {
  const [stars, setStars] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`https://api.github.com/repos/${GH_REPO}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d && typeof d.stargazers_count === "number") setStars(d.stargazers_count); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <a
      href={`https://github.com/${GH_REPO}/stargazers`}
      target="_blank"
      rel="noopener noreferrer"
      title="Star RAG Doctor on GitHub"
      className="icon-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        height: "36px",
        padding: "0 12px",
        borderRadius: T.radius.md,
        border: `1px solid ${T.color.border}`,
        background: T.color.surface,
        color: T.color.textMuted,
        textDecoration: "none",
        fontFamily: T.font.mono,
        fontSize: "0.8rem",
        fontWeight: 500,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" style={{ fill: T.color.saffron }} aria-hidden="true">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
      </svg>
      <span>{stars == null ? "Star" : stars.toLocaleString()}</span>
    </a>
  );
}

// ─── Brand lockup ─────────────────────────────────────────────────────────────
// Mirrors the Page-1 hero lockup so the wordmark is identical across the app:
// solid "RAG Doctor", a hairline pink divider, and the gradient "Playground".
export function Logo() {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "baseline",
      fontFamily: T.font.sans,
      letterSpacing: "-0.02em",
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--hero-ink)" }}>RAG Doctor</span>
      <span aria-hidden style={{ fontSize: "1rem", fontWeight: 400, color: "var(--hero-play-from)", margin: "0 0.3em" }}>/</span>
      <span className="hero-playground" style={{ fontSize: "1rem", fontWeight: 700 }}>Playground</span>
    </div>
  );
}

export const GitHubMark = ({ size = 17 }) => (
  <svg height={size} viewBox="0 0 16 16" width={size} aria-hidden="true" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z"></path>
  </svg>
);
