import "./globals.css";
import { useState, useEffect, useMemo, createContext, useContext } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
// Core 5: Burgundy · Coral · Saffron · Sage · Plum.
// Every color is a CSS custom property so the whole app re-themes via [data-theme].
// globals.css is the single source of truth for color values.
export const T = {
  font: {
    sans: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    mono: `"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, "Consolas", monospace`,
  },
  color: {
    burgundy: "var(--burgundy)",
    burgundyInk: "var(--burgundyInk)",
    burgundySoft: "var(--burgundySoft)",
    coral: "var(--coral)",
    coralInk: "var(--coralInk)",
    coralSoft: "var(--coralSoft)",
    saffron: "var(--saffron)",
    saffronInk: "var(--saffronInk)",
    saffronSoft: "var(--saffronSoft)",
    sage: "var(--sage)",
    sageInk: "var(--sageInk)",
    sageSoft: "var(--sageSoft)",
    plum: "var(--plum)",
    plumInk: "var(--plumInk)",
    plumSoft: "var(--plumSoft)",
    brand: "var(--brand)",
    brandHover: "var(--brandHover)",
    brandSoft: "var(--brandSoft)",
    brandText: "var(--brandText)",
    accent: "var(--accent)",
    accentSoft: "var(--accentSoft)",
    success: "var(--success)",
    successSoft: "var(--successSoft)",
    danger: "var(--danger)",
    warning: "var(--warning)",
    warningSoft: "var(--warningSoft)",
    bg: "var(--bg)",
    surface: "var(--surface)",
    surfaceMuted: "var(--surfaceMuted)",
    surfaceSunk: "var(--surfaceSunk)",
    border: "var(--border)",
    borderStrong: "var(--borderStrong)",
    text: "var(--text)",
    textMuted: "var(--textMuted)",
    textSubtle: "var(--textSubtle)",
    scoreNeg1: "var(--scoreNeg1)",
    score0: "var(--score0)",
    score1: "var(--score1)",
    score2: "var(--score2)",
    score3: "var(--score3)",
    onColorLight: "var(--onColorLight)",
    onColorDark: "var(--onColorDark)",
  },
  radius: { sm: "6px", md: "8px", lg: "12px", xl: "16px", pill: "999px" },
  shadow: { sm: "var(--shadowSm)", md: "var(--shadowMd)", lg: "var(--shadowLg)", focus: "var(--shadowFocus)" },
};

export function useFonts() {
  useEffect(() => {
    if (!document.getElementById("rag-doctor-fonts")) {
      const pre1 = document.createElement("link");
      pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
      document.head.appendChild(pre1);
      const pre2 = document.createElement("link");
      pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "";
      document.head.appendChild(pre2);
      const link = document.createElement("link");
      link.id = "rag-doctor-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);
}

// ─── Theme (light / dark) ─────────────────────────────────────────────────────
const THEME_KEY = "rag-doctor-theme";

export function resolveInitialTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    // Default to dark when the visitor hasn't chosen a theme yet.
    return "dark";
  } catch {
    return "dark";
  }
}

// Apply before first paint to avoid a flash of the wrong theme.
if (typeof document !== "undefined") {
  document.documentElement.dataset.theme = resolveInitialTheme();
}

const ThemeContext = createContext({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);
  const value = useMemo(() => ({
    theme,
    toggle: () => setTheme(t => (t === "dark" ? "light" : "dark")),
  }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: T.radius.md,
        border: `1px solid ${T.color.border}`,
        background: T.color.surface,
        color: T.color.textMuted,
        cursor: "pointer",
        padding: 0,
      }}
    >
      {isDark ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
