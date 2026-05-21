import { T } from "../theme";
import { embeddingModels, answerGenLLMModels } from "../constants";

export function RAGSettings({ title, selectedModel, onModelChange,
  topN, onTopNChange, semanticWeight, onSemanticWeightChange,
  agLLM, onAGLLMChange, highlightGreen, fingerHint, winner,
}) {
  const sw = Math.max(0, Math.min(1, Number(semanticWeight) || 0));
  const kw = 1 - sw;
  const isControl = title.includes("Control");

  const labelStyle = {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: T.color.text,
    marginBottom: "8px",
    letterSpacing: "-0.005em",
  };

  const fieldShellBase = {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "12px 14px",
    background: T.color.surface,
    border: `1px solid ${T.color.border}`,
    borderRadius: T.radius.md,
    boxSizing: "border-box",
    transition: "border-color 160ms var(--ease-out-quart), background-color 160ms var(--ease-out-quart), box-shadow 160ms var(--ease-out-quart)",
  };

  const monoValueStyle = {
    fontFamily: T.font.mono,
    fontWeight: 500,
    fontSize: "1rem",
    color: T.color.text,
    letterSpacing: "-0.005em",
    fontVariantNumeric: "tabular-nums",
    minWidth: 0,             // allow shrink inside flex field shells
    textOverflow: "ellipsis",
  };

  const sageActive = highlightGreen ? {
    border: `1.5px solid ${T.color.sage}`,
    boxShadow: `0 0 0 3px ${T.color.sageSoft}`,
  } : null;

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        border: `1px solid ${winner ? T.color.sage : T.color.border}`,
        borderRadius: T.radius.xl,
        padding: "22px",
        margin: "16px 12px",
        background: T.color.surfaceMuted,
        boxSizing: "border-box",
        height: "calc(100% - 32px)",
        overflowY: "auto",
        overflowX: "hidden",
        minWidth: 0,
        boxShadow: T.shadow.sm,
      }}
    >
      {winner && (
        <div className="winner-badge" style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          zIndex: 3,
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: T.color.sageSoft,
          color: T.color.sageInk,
          border: `1px solid ${T.color.sageInk}`,
          fontFamily: T.font.mono,
          fontSize: "0.62rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "3px 9px",
          borderRadius: T.radius.pill,
        }}>
          Winner
        </div>
      )}
      {/* Group eyebrow */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{
          fontFamily: T.font.mono,
          fontSize: "0.68rem",
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: T.color.textSubtle,
          marginBottom: "2px",
        }}>
          {isControl ? "Control · A" : "Test · B"}
        </div>
        <h2 style={{
          color: isControl ? T.color.brandText : T.color.coralInk,
          margin: 0,
          fontSize: "1.1rem",
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}>
          {/* title format: "<group>: <heading>" — heading reflects the live RAG identity */}
          {title.split(": ")[1] ?? title}
        </h2>
      </div>

      {highlightGreen && (
        <div className="enter-up" style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: T.color.sageSoft,
          color: T.color.sageInk,
          border: `1px solid ${T.color.sage}`,
          borderRadius: T.radius.md,
          padding: "9px 12px",
          marginBottom: "16px",
          fontSize: "0.8rem",
          fontWeight: 600,
        }}>
          <span aria-hidden style={{ fontSize: "0.9rem" }}>✓</span>
          Updated to new control settings
        </div>
      )}
      {fingerHint && (
        <div className="enter-up" style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: T.color.saffronSoft,
          border: `1px solid ${T.color.saffron}`,
          borderRadius: T.radius.md,
          padding: "9px 12px",
          marginBottom: "16px",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: T.color.saffronInk,
        }}>
          <span style={{ display: "inline-block", animation: "fingerBounce 1.4s ease-in-out infinite" }} aria-hidden>👇</span>
          Adjust test settings here
        </div>
      )}

      {/* Stacked controls — one per row at this panel width */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginBottom: "22px",
      }}>
        {/* Embedding Model */}
        <div>
          <label htmlFor={`${title}-embedding-model`} style={labelStyle}>
            Embedding Model
          </label>
          <div style={{ ...fieldShellBase, padding: 0, overflow: "hidden" }}>
            <select
              id={`${title}-embedding-model`}
              value={selectedModel}
              onChange={e => onModelChange(e.target.value)}
              style={{
                ...monoValueStyle,
                width: "100%",
                padding: "12px 14px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {embeddingModels.map(model => (
                <option key={model.value} value={model.value}>{model.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top N */}
        <div>
          <label style={{ ...labelStyle, whiteSpace: "nowrap" }}>Top N Retrieved Content</label>
          <div style={{ ...fieldShellBase, padding: 0, overflow: "hidden", ...(sageActive || {}) }}>
            <select
              value={topN}
              onChange={e => onTopNChange(Number(e.target.value))}
              style={{
                ...monoValueStyle,
                width: "100%",
                padding: "12px 14px",
                border: "none",
                background: "transparent",
                color: highlightGreen ? T.color.sageInk : T.color.text,
                fontWeight: highlightGreen ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </div>
          {highlightGreen && (
            <div className="enter-up" style={{
              marginTop: "8px",
              fontFamily: T.font.mono,
              fontSize: "0.72rem",
              color: T.color.textSubtle,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span style={{ color: T.color.sage }}>↑</span>
              swap into Control Group
            </div>
          )}
        </div>

        {/* Semantic Weight (mirrors slider) */}
        <div>
          <label style={{ ...labelStyle, whiteSpace: "nowrap" }}>Semantic Weight <span style={{ fontWeight: 400, color: T.color.textSubtle, fontFamily: T.font.mono, fontSize: "0.72rem" }}>(0–1)</span></label>
          <div style={fieldShellBase}>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={sw.toFixed(2)}
              onChange={e => {
                let v = Number(e.target.value);
                if (Number.isNaN(v)) v = 0;
                if (v < 0) v = 0;
                if (v > 1) v = 1;
                onSemanticWeightChange(v);
              }}
              style={{
                ...monoValueStyle,
                fontSize: "1.05rem",
                fontWeight: 500,
                width: "100%",
                border: "none",
                background: "transparent",
                outline: "none",
                padding: 0,
              }}
            />
          </div>
        </div>

        {/* Keyword Weight (auto, read-only) */}
        <div>
          <label style={labelStyle}>
            Keyword Weight{" "}
            <span style={{ fontFamily: T.font.mono, fontWeight: 400, color: T.color.textSubtle, fontSize: "0.72rem" }}>
              (auto)
            </span>
          </label>
          <div style={{
            ...fieldShellBase,
            background: T.color.surfaceSunk,
          }}>
            <span style={{ ...monoValueStyle, fontSize: "1.05rem", color: T.color.textMuted }}>
              {kw.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Slider — full width */}
      <div style={{ marginBottom: "22px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            Semantic <span style={{ fontFamily: T.font.mono, color: T.color.textSubtle, fontWeight: 400 }}>⇌</span> Keyword balance
          </label>
        </div>
        <div style={{ position: "relative", padding: "8px 0" }}>
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: "6px",
            background: T.color.coralSoft,
            borderRadius: T.radius.pill,
          }} />
          <div style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: `${sw * 100}%`,
            height: "6px",
            background: T.color.coral,
            borderRadius: T.radius.pill,
            transition: "width 120ms var(--ease-out-quart)",
          }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sw}
            onChange={e => onSemanticWeightChange(Number(e.target.value))}
            className="balance-slider"
            style={{
              position: "relative",
              width: "100%",
              margin: 0,
              background: "transparent",
              WebkitAppearance: "none",
              appearance: "none",
              height: "20px",
              cursor: "pointer",
              zIndex: 1,
            }}
            aria-label="Semantic to keyword balance"
          />
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "4px",
          fontFamily: T.font.mono,
          fontSize: "0.7rem",
          color: T.color.textSubtle,
          letterSpacing: "0.02em",
        }}>
          <span>semantic</span>
          <span>keyword</span>
        </div>
      </div>

      {/* Answer Generation LLM — full width */}
      <div>
        <label htmlFor={`${title}-answer-gen-llm`} style={labelStyle}>
          Answer Generation LLM
        </label>
        <div style={{ ...fieldShellBase, padding: 0, overflow: "hidden" }}>
          <select
            id={`${title}-answer-gen-llm`}
            value={agLLM}
            onChange={e => onAGLLMChange(e.target.value)}
            style={{
              ...monoValueStyle,
              width: "100%",
              padding: "12px 14px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {answerGenLLMModels.map(model => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
