import { useState, Fragment } from "react";
import { T, ThemeToggle, useTheme } from "../theme";
import { BACKEND_URL } from "../constants";
import { Logo } from "../components/Logo";
import DotField from "../components/DotField";

// ─── Page 1: Dataset Selection ───────────────────────────────────────────────

export function DatasetPage({ onDatasetReady }) {
  const [selectedDataset, setSelectedDataset] = useState("");
  const [datasetClicked, setDatasetClicked] = useState(false);
  const [preprocessingStatus, setPreprocessingStatus] = useState("idle");
  const [preprocessingMessage, setPreprocessingMessage] = useState("");
  const { theme } = useTheme();

  // Interactive dot field behind the content. The dot/glow colors must
  // contrast with the page, so they flip with the theme: dark ink dots on
  // the light background, warm light dots on the dark one.
  const dots =
    theme === "dark"
      ? { gradientFrom: "rgba(235, 228, 216, 0.5)", gradientTo: "rgba(180, 151, 207, 0.3)", glowColor: "#2E2440" }
      : { gradientFrom: "#000000", gradientTo: "rgba(180, 151, 207, 0.25)", glowColor: "#A374BD" };

  const handleFIQASelect = async () => {
    setSelectedDataset("FIQA Data");
    setDatasetClicked(true);
    setPreprocessingStatus("running");
    setPreprocessingMessage("Preprocessing the data ...");
    try {
      await fetch(`https://${BACKEND_URL}/load-fiqa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_name: "FIQA Data" }),
      });
      const poll = setInterval(async () => {
        const res = await fetch(`https://${BACKEND_URL}/preprocessing-status`);
        const data = await res.json();
        setPreprocessingMessage(data.message);
        if (data.status === "done" || data.status === "error") {
          setPreprocessingStatus(data.status);
          clearInterval(poll);
        }
      }, 2000);
    } catch (err) {
      setPreprocessingStatus("error");
      setPreprocessingMessage("Error starting preprocessing.");
    }
  };

  const isSelected = datasetClicked && selectedDataset === "FIQA Data";

  // Onboarding: a quiet 3-step journey rail that names the whole flow,
  // replacing the dead-end "Step 1 ·" eyebrow.
  const journey = [
    { n: 1, label: "Select dataset", active: true },
    { n: 2, label: "Compare setups", active: false },
    { n: 3, label: "Trace root cause", active: false },
  ];

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

      {/* One centred optical group: hero → journey → card → CTA */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "480px",
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
            gap: "20px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (isSelected) {
                setSelectedDataset("");
                setDatasetClicked(false);
                setPreprocessingStatus("idle");
                setPreprocessingMessage("");
              } else {
                handleFIQASelect();
              }
            }}
            style={{
              width: "100%",
              textAlign: "left",
              background: T.color.surface,
              border: `1.5px solid ${isSelected ? T.color.accent : T.color.border}`,
              borderRadius: T.radius.lg,
              padding: "20px 22px",
              cursor: "pointer",
              boxShadow: isSelected ? T.shadow.md : T.shadow.sm,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{
                  fontSize: "1.1rem",
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
              <div style={{ color: T.color.textMuted, fontSize: "0.9rem", lineHeight: 1.45 }}>
                Finance Q&amp;A benchmark.{" "}
                <a
                  href="https://huggingface.co/datasets/vibrantlabsai/fiqa"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontWeight: 500 }}
                >
                  View on Hugging Face →
                </a>
              </div>
              {isSelected && preprocessingStatus !== "idle" && (
                <div style={{
                  marginTop: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.85rem",
                  color: preprocessingStatus === "running" ? T.color.textMuted : T.color.success,
                }}>
                  {preprocessingStatus === "running" ? (
                    <div style={{
                      width: "14px", height: "14px",
                      border: `2px solid ${T.color.border}`,
                      borderTopColor: T.color.accent,
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      flexShrink: 0,
                    }} />
                  ) : (
                    <span style={{ color: T.color.success }} aria-hidden>✓</span>
                  )}
                  <span>{preprocessingMessage}</span>
                </div>
              )}
            </div>
            <div style={{
              width: "22px",
              height: "22px",
              borderRadius: T.radius.pill,
              border: `2px solid ${isSelected ? T.color.accent : T.color.borderStrong}`,
              background: isSelected ? T.color.accent : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px",
            }}>
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path d="M2.5 6.2l2.4 2.4L9.5 3.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>

          {preprocessingStatus === "done" && (
            <button
              onClick={() => onDatasetReady(selectedDataset)}
              className="enter-up"
              style={{
                position: "relative",
                overflow: "hidden",
                background: T.color.brand,
                color: "#fff",
                border: "none",
                borderRadius: T.radius.md,
                padding: "16px 36px",
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
              <span>Start RAG A/B test</span>
              <span className="nudge-on-hover" style={{ display: "inline-block", fontSize: "1.15rem", lineHeight: 1 }} aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
