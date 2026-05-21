import { useState, useEffect, Fragment } from "react";
import { T, ThemeToggle } from "../theme";
import { BACKEND_URL } from "../constants";
import HeroBackground from "../components/HeroBackground";

// ─── Page 1: Dataset Selection ───────────────────────────────────────────────
// A calm, centred customer-demo hero: spring mood, one dataset card, one primary
// action. The decorative backdrop lives in <HeroBackground/>; the hero runs its
// own --hero-* palette so the rest of the app stays untouched.

// Brand sparkle mark: a single four-point twinkle, filled with a soft lilac to
// plum gradient so it sits inside the hero palette instead of fighting it.
function SparkMark() {
  return (
    <svg width="46" height="46" viewBox="0 0 40 40" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id="sparkMark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--hero-spark)" />
          <stop offset="100%" stopColor="var(--hero-play-to)" />
        </linearGradient>
      </defs>
      <g transform="translate(20 20)" fill="url(#sparkMark)">
        <path d="M0 -19 C 1.7 -6.8 1.9 -3.4 0 0 C -1.9 -3.4 -1.7 -6.8 0 -19 Z" />
        <path d="M19 0 C 6.8 1.7 3.4 1.9 0 0 C 3.4 -1.9 6.8 -1.7 19 0 Z" />
        <path d="M0 19 C -1.7 6.8 -1.9 3.4 0 0 C 1.9 3.4 1.7 6.8 0 19 Z" />
        <path d="M-19 0 C -6.8 -1.7 -3.4 -1.9 0 0 C -3.4 1.9 -6.8 1.7 -19 0 Z" />
      </g>
    </svg>
  );
}

// Top-bar brand lockup: full product name with a smaller "Playground"
// qualifier, the gradient kept as the signature treatment.
function BrandLockup() {
  return (
    <div style={{
      display: "flex",
      alignItems: "baseline",
      fontFamily: T.font.sans,
      letterSpacing: "-0.02em",
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: "1.16rem", fontWeight: 800, color: "var(--hero-ink)" }}>RAG Doctor</span>
      <span aria-hidden style={{ fontSize: "0.82rem", fontWeight: 400, color: "var(--hero-play-from)", margin: "0 0.3em" }}>/</span>
      <span className="hero-playground" style={{ fontSize: "0.82rem", fontWeight: 700 }}>Playground</span>
    </div>
  );
}

export function DatasetPage({ onDatasetReady }) {
  const [selectedDataset, setSelectedDataset] = useState("");
  const [preprocessingStatus, setPreprocessingStatus] = useState("idle");

  // Paint the page chrome (html/body) with the hero palette so overscroll never
  // reveals the warm app background underneath. Restored on unmount.
  useEffect(() => {
    const root = document.documentElement;
    const prevRoot = root.style.background;
    const prevBody = document.body.style.background;
    root.style.background = "var(--hero-bg)";
    document.body.style.background = "var(--hero-bg)";
    return () => {
      root.style.background = prevRoot;
      document.body.style.background = prevBody;
    };
  }, []);

  const handleTryNow = async () => {
    setSelectedDataset("FIQA Data");
    setPreprocessingStatus("running");
    try {
      await fetch(`https://${BACKEND_URL}/load-fiqa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_name: "FIQA Data" }),
      });
      const poll = setInterval(async () => {
        const res = await fetch(`https://${BACKEND_URL}/preprocessing-status`);
        const data = await res.json();
        if (data.status === "done" || data.status === "error") {
          setPreprocessingStatus(data.status);
          clearInterval(poll);
        }
      }, 2000);
    } catch (err) {
      setPreprocessingStatus("error");
    }
  };

  // One-click flow: once preprocessing finishes, go straight to the A/B test.
  useEffect(() => {
    if (preprocessingStatus === "done") onDatasetReady(selectedDataset);
  }, [preprocessingStatus, selectedDataset, onDatasetReady]);

  // A quiet 3-step journey rail naming the whole flow.
  const journey = [
    { n: 1, label: "Select dataset", active: true },
    { n: 2, label: "Compare RAG setups", active: false },
    { n: 3, label: "Trace root cause", active: false },
  ];

  const busy = preprocessingStatus === "running" || preprocessingStatus === "done";
  const errored = preprocessingStatus === "error";

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      width: "100%",
      minHeight: "100vh",
      background: "var(--hero-bg)",
      fontFamily: T.font.sans,
      boxSizing: "border-box",
      overflowX: "hidden",
    }}>
      <HeroBackground />

      {/* Top bar: brand lockup + theme toggle. */}
      <header style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "20px 26px",
      }}>
        <BrandLockup />
        <ThemeToggle />
      </header>

      {/* Centred hero cluster, filling the space below the top bar. */}
      <div style={{
        position: "relative",
        zIndex: 1,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "16px 24px 96px",
        boxSizing: "border-box",
      }}>
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* Sparkle mark. */}
          <div className="enter-up" style={{ display: "flex", justifyContent: "center" }}>
            <SparkMark />
          </div>

          {/* Title. */}
          <h1 className="enter-up" style={{
            animationDelay: "60ms",
            margin: "14px 0 0",
            fontSize: "clamp(2.7rem, 7.8vw, 4.7rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            color: "var(--hero-ink)",
            textAlign: "center",
          }}>
            RAG Doctor
          </h1>

          {/* Subtitle. */}
          <p className="enter-up" style={{
            animationDelay: "110ms",
            color: "var(--hero-ink-soft)",
            fontSize: "1.04rem",
            lineHeight: 1.6,
            margin: "18px auto 0",
            maxWidth: "39rem",
            textAlign: "center",
          }}>
            Run RAG configurations side by side, see statistical winners,{" "}
            <br className="hero-sub-br" />
            and trace failures back to retrieval, prompts, or stale ground truth.
          </p>

          {/* Journey rail. */}
          <div className="enter-up" style={{
            animationDelay: "160ms",
            marginTop: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "nowrap",
            gap: "8px",
          }}>
            {journey.map((s, i) => (
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
                    background: s.active ? "var(--hero-accent)" : "transparent",
                    color: s.active ? "var(--hero-accent-ink)" : "var(--hero-ink-faint)",
                    border: s.active ? "none" : "1.5px solid var(--hero-border-strong)",
                    boxShadow: s.active ? "0 0 15px 1px var(--hero-accent-glow)" : "none",
                  }}>
                    {s.n}
                  </span>
                  <span
                    className={s.active ? undefined : "hero-step-rest"}
                    style={{
                      fontSize: "0.83rem",
                      fontWeight: s.active ? 600 : 500,
                      color: s.active ? "var(--hero-ink)" : "var(--hero-ink-faint)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </span>
                </span>
              </Fragment>
            ))}
          </div>

          {/* FIQA — the one major card: a quiet info panel for context. */}
          <div className="enter-up" style={{
            animationDelay: "210ms",
            width: "100%",
            maxWidth: "468px",
            marginTop: "26px",
            background: "var(--hero-surface)",
            border: "1px solid var(--hero-border)",
            borderRadius: "16px",
            padding: "18px 22px",
            textAlign: "left",
            boxShadow: "var(--hero-card-shadow)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.16rem", fontWeight: 800, color: "var(--hero-ink)", letterSpacing: "-0.01em" }}>
                FIQA
              </span>
              <span style={{
                fontSize: "0.69rem",
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: T.radius.pill,
                background: "var(--hero-surface-2)",
                color: "var(--hero-ink-soft)",
                letterSpacing: "0.01em",
              }}>
                30 records
              </span>
            </div>

            <div style={{ marginTop: "8px", color: "var(--hero-ink-soft)", fontSize: "0.91rem", lineHeight: 1.5 }}>
              Finance Q&amp;A benchmark.{" "}
              <a
                href="https://huggingface.co/datasets/vibrantlabsai/fiqa"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--hero-link)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                View on Hugging Face →
              </a>
            </div>
          </div>

          {/* The single primary action. One click → preprocess → A/B test. */}
          <div className="enter-up" style={{ animationDelay: "260ms", marginTop: "26px" }}>
            {busy ? (
              <button type="button" disabled style={CTA_BUSY_STYLE}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(0,0,0,0.18)",
                  borderTopColor: "var(--hero-cta-text)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  flexShrink: 0,
                }} />
                <span>Preprocessing the dataset…</span>
              </button>
            ) : (
              <button type="button" onClick={handleTryNow} style={CTA_STYLE}>
                <span className="cta-fill" />
                <span>{errored ? "Something went wrong — retry" : "Try it now"}</span>
                {!errored && (
                  <span className="nudge-on-hover" aria-hidden style={{ display: "inline-block", fontSize: "1.15rem", lineHeight: 1 }}>→</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const CTA_STYLE = {
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(135deg, var(--hero-cta-from), var(--hero-cta-to))",
  color: "var(--hero-cta-text)",
  border: "none",
  borderRadius: "14px",
  padding: "17px 38px",
  fontSize: "1.05rem",
  fontWeight: 700,
  letterSpacing: "0.01em",
  cursor: "pointer",
  boxShadow: "0 14px 32px var(--hero-cta-glow)",
  display: "inline-flex",
  alignItems: "center",
  gap: "11px",
};

const CTA_BUSY_STYLE = {
  ...CTA_STYLE,
  cursor: "default",
  opacity: 0.85,
  boxShadow: "none",
};
