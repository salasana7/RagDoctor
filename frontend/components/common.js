import { useState } from "react";
import { T } from "../theme";

// Loading spinner — a rotating ring with the soft theme-tinted halo.
// The `spin` and `spinnerGlow` keyframes live in globals.css.
export function Spinner({ size = 40, thickness = 3, track = T.color.border, head = T.color.coral, speed = 0.9, style }) {
  return (
    <div
      aria-hidden
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `${thickness}px solid ${track}`,
        borderTopColor: head,
        borderRadius: "50%",
        animation: `spin ${speed}s linear infinite, spinnerGlow 2.4s ease-in-out infinite`,
        ...style,
      }}
    />
  );
}

export function ExpandableText({ text, maxTokens = 66 }) {
  const [expanded, setExpanded] = useState(false);
  const tokens = (text || "").split(/\s+/).filter(Boolean);
  const isLong = tokens.length > maxTokens;
  const display = (!isLong || expanded) ? text : tokens.slice(0, maxTokens).join(" ") + "…";
  return (
    <>
      {display}
      {isLong && (
        <div>
          <button onClick={() => setExpanded(e => !e)} style={{
            marginTop: "6px",
            background: "none",
            border: "none",
            color: T.color.brandText,
            cursor: "pointer",
            fontSize: "0.75rem",
            padding: 0,
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}>
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </>
  );
}

export function SuggestionItem({ text, onCheckedChange }) {
  const [checked, setChecked] = useState(false);
  return (
    <label style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      marginBottom: "10px",
      padding: "8px 10px",
      borderRadius: T.radius.sm,
      cursor: "pointer",
      color: checked ? T.color.textSubtle : T.color.text,
      textDecoration: checked ? "line-through" : "none",
      fontSize: "0.9rem",
      lineHeight: 1.5,
      transition: "background-color 150ms ease, color 150ms ease",
      background: checked ? T.color.surfaceSunk : "transparent",
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => { const next = !checked; setChecked(next); if (onCheckedChange) onCheckedChange(next); }}
        style={{ marginTop: "2px", accentColor: T.color.brand, width: "16px", height: "16px", flexShrink: 0 }}
      />
      {text}
    </label>
  );
}
