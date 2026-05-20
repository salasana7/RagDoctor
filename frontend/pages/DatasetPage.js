import { useState, useEffect, Fragment } from "react";
import { T, ThemeToggle, useTheme } from "../theme";
import { BACKEND_URL } from "../constants";
import { Logo } from "../components/Logo";
import DotField from "../components/DotField";

// ─── Page 1: Dataset Selection ───────────────────────────────────────────────

export function DatasetPage({ onDatasetReady }) {
  const [selectedDataset, setSelectedDataset] = useState("");
  const [preprocessingStatus, setPreprocessingStatus] = useState("idle");
  const { theme } = useTheme();

  // Interactive dot field behind the content. The dot/glow colors must
  // contrast with the page, so they flip with the theme: dark ink dots on
  // the light background, warm light dots on the dark one.
  const dots =
    theme === "dark"
      ? { gradientFrom: "rgba(235, 228, 216, 0.5)", gradientTo: "rgba(180, 151, 207, 0.3)", glowColor: "#2E2440" }
      : { gradientFrom: "#000000", gradientTo: "rgba(180, 151, 207, 0.25)", glowColor: "#A374BD" };

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

  // Onboarding: a quiet 3-step journey rail that names the whole flow,
  // replacing the dead-end "Step 1 ·" eyebrow.
  const journey = [
    { n: 1, label: "Select dataset", active: true },
    { n: 2, label: "Compare setups", active: false },
    { n: 3, label: "Trace root cause", active: false },
  ];

  const busy = preprocessingStatus === "running" || preprocessingStatus === "done";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      minHeight: "100vh",
      background: T.color.bg,
      fontFamily: T.font.sans,
      // Asymmetric padding nudges the cluster a hair above true centre.
      padding: "44px 24px 80px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>
      <DotField
        dotRadius={1.5}
        dotSpacing={14}
        cursorRadius={500}
        cursorForce={0.1}
        bulgeOnly
        bulgeStrength={67}
        glowRadius={110}
        sparkle
        waveAmplitude={0}
        gradientFrom={dots.gradientFrom}
        gradientTo={dots.gradientTo}
        glowColor={dots.glowColor}
        style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />
      <div style={{ position: "absolute", top: "20px", right: "24px", zIndex: 1 }}>
        <ThemeToggle />
      </div>

      {/* One centred optical group: hero → journey → dataset → CTA.
          No fixed width here — the lg logo is wider than the card, so a
          narrow cluster would overflow and break centring. Each block
          constrains its own measure instead. */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div className="enter-up" style={{ width: "100%", textAlign: "center" }}>
          <Logo size="lg" />
          <p style={{
            color: T.color.textMuted,
            fontSize: "1.02rem",
            lineHeight: 1.55,
            margin: "16px auto 0",
            maxWidth: "44ch",
          }}>
            Run RAG configurations side by side, see statistical winners, and trace failures back to retrieval, prompts, or stale ground truth.
          </p>
        </div>

        <div
          className="enter-up"
          style={{
            animationDelay: "60ms",
            marginTop: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "nowrap",
            gap: "7px",
          }}
        >
          {journey.map((s, i) => (
            <Fragment key={s.n}>
              {i > 0 && (
                <span style={{ width: "16px", height: "1.5px", background: T.color.border, flexShrink: 0 }} aria-hidden />
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: T.radius.pill,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  background: s.active ? T.color.brand : "transparent",
                  color: s.active ? "#fff" : T.color.textSubtle,
                  border: s.active ? "none" : `1.5px solid ${T.color.border}`,
                }}>
                  {s.n}
                </span>
                <span style={{
                  fontSize: "0.82rem",
                  fontWeight: s.active ? 600 : 500,
                  color: s.active ? T.color.text : T.color.textSubtle,
                }}>
                  {s.label}
                </span>
              </span>
            </Fragment>
          ))}
        </div>

        <div
          className="enter-up"
          style={{
            animationDelay: "110ms",
            width: "100%",
            marginTop: "26px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
          }}
        >
          {/* FIQA — a quiet info panel for context, not a chooser. There is
              only one dataset, so there is nothing to "select". */}
          <div style={{
            width: "100%",
            maxWidth: "460px",
            background: T.color.surface,
            border: `1px solid ${T.color.border}`,
            borderRadius: T.radius.lg,
            padding: "16px 20px",
            textAlign: "left",
            boxShadow: T.shadow.sm,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
              <span style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: T.color.text,
                letterSpacing: "-0.005em",
              }}>
                FIQA
              </span>
              <span style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: T.radius.pill,
                background: T.color.surfaceSunk,
                color: T.color.textMuted,
                letterSpacing: "0.02em",
              }}>
                30 records
              </span>
            </div>
            <div style={{ color: T.color.textMuted, fontSize: "0.88rem", lineHeight: 1.45 }}>
              Finance Q&amp;A benchmark.{" "}
              <a
                href="https://huggingface.co/datasets/vibrantlabsai/fiqa"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 500 }}
              >
                View on Hugging Face →
              </a>
            </div>
          </div>

          {/* The single primary action. One click → preprocess → A/B test. */}
          {busy ? (
            <button
              type="button"
              disabled
              style={{
                background: T.color.brand,
                color: "#fff",
                border: "none",
                borderRadius: T.radius.md,
                padding: "16px 32px",
                fontSize: "1.05rem",
                fontWeight: 600,
                cursor: "default",
                opacity: 0.9,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                letterSpacing: "0.01em",
              }}
            >
              <div style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(255,255,255,0.35)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }} />
              <span>Preprocessing the dataset…</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTryNow}
              style={{
                position: "relative",
                overflow: "hidden",
                background: T.color.brand,
                color: "#fff",
                border: "none",
                borderRadius: T.radius.md,
                padding: "16px 38px",
                fontSize: "1.05rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(128,0,0,0.20)",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                letterSpacing: "0.01em",
              }}
            >
              <span className="cta-fill" />
              <span>{preprocessingStatus === "error" ? "Something went wrong — retry" : "Try it now"}</span>
              {preprocessingStatus !== "error" && (
                <span className="nudge-on-hover" style={{ display: "inline-block", fontSize: "1.15rem", lineHeight: 1 }} aria-hidden>→</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
