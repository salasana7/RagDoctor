import { useState } from "react";
import { T } from "../theme";

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

export function ExpandableCell({ text, style, maxTokens = 66 }) {
  return <td style={style}><ExpandableText text={text} maxTokens={maxTokens} /></td>;
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
      transition: "background 150ms",
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
