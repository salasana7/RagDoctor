import { useState } from "react";
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
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        minHeight: "100vh",
        background: T.color.bg,
        fontFamily: T.font.sans,
        padding: "72px 24px 48px",
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
        <div className="enter-up" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "640px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", margin: "0 0 18px 0" }}>
            <Logo size="lg" />
          </div>
          <p style={{
            color: T.color.textMuted,
            fontSize: "1.05rem",
            lineHeight: 1.55,
            margin: "0 auto 40px",
            maxWidth: "52ch",
          }}>
            Run RAG configurations side by side, see statistical winners, and trace failures back to retrieval, prompts, or stale ground truth.
          </p>
        </div>

        <div className="enter-up" style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "640px",
          animationDelay: "80ms",
          animationDuration: "520ms",
        }}>
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.color.textSubtle,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>Step 1 · Select a dataset</span>
            <span style={{ display: "inline-block", animation: "slideInText 2.8s ease-in-out infinite", color: T.color.brandText }}>↓</span>
          </div>

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
        </div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "48px", width: "100%", maxWidth: "640px" }}>
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
    );
}
