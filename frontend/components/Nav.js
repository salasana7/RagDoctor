import { T, ThemeToggle } from "../theme";
import { Logo, GitHubMark, GitHubStars } from "./Logo";

// ─── App nav ──────────────────────────────────────────────────────────────────
// One header for every page: the brand lockup on the left, the theme toggle +
// GitHub controls on the right. `extras` slots page-specific items (e.g. the
// dataset status pill on the A/B test page) just before the shared controls.
export function Nav({ extras }) {
  return (
    <header style={{
      position: "relative",
      zIndex: 2,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      padding: "20px 26px",
    }}>
      <Logo />
      <div className="app-navcluster" style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        // Pin the toggle / GitHub controls to the hero palette so the nav
        // renders identically on every page.
        "--surface": "var(--hero-surface)",
        "--surfaceMuted": "var(--hero-surface-2)",
        "--border": "var(--hero-border)",
        "--borderStrong": "var(--hero-border-strong)",
        "--textMuted": "var(--hero-ink-soft)",
        "--text": "var(--hero-ink)",
      }}>
        {extras}
        <ThemeToggle />
        <a
          href="https://github.com/hanhanwu/RagDoctor"
          target="_blank"
          rel="noopener noreferrer"
          title="Open GitHub repository"
          aria-label="Open GitHub repository"
          className="icon-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            borderRadius: T.radius.md,
            border: `1px solid ${T.color.border}`,
            background: T.color.surface,
            color: T.color.textMuted,
            textDecoration: "none",
          }}
        >
          <GitHubMark />
        </a>
        <GitHubStars />
      </div>
    </header>
  );
}
