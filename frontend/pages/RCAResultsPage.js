import { useState } from "react";
import { T, useFonts } from "../theme";
import { BACKEND_URL, SCORE_COLORS } from "../constants";
import { ExpandableText, ExpandableCell } from "../components/common";

export function RCAResultsPage({ results, dataset }) {
  useFonts();
  if (!results) return (
    <div style={{
      padding: "48px",
      fontFamily: T.font.sans,
      color: T.color.brandText,
      fontSize: "1.1rem",
      fontWeight: 500,
      height: "100vh",
      overflowY: "auto",
      boxSizing: "border-box",
      background: T.color.bg,
      display: "flex",
      alignItems: "center",
      gap: "14px",
    }}>
      <div style={{
        width: "20px", height: "20px",
        border: `3px solid ${T.color.border}`,
        borderTopColor: T.color.coral,
        borderRadius: "50%",
        animation: "spin 0.9s linear infinite",
      }} />
      Analysis is running. This page will update automatically when done.
    </div>
  );

  const controlGroup = results.controlGroup || "rag2";
  const controlItems = results[controlGroup];
  const controlLabel = controlGroup === "rag1" ? "RAG 1" : "RAG 2";

  const reEvalRows = controlItems
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => item?.needs_re_eval === 1);

  const REEVAL_KEYS = new Set([
    "Please review referenced answer",
    "Please review referenced content",
    "Please review query quality",
  ]);

  function getControlSuggestions(rca) {
    const merged = [];
    for (const key of REEVAL_KEYS) {
      const values = new Set();
      for (const obj of (rca || [])) {
        if (!obj || !(key in obj)) continue;
        const v = obj[key];
        if (Array.isArray(v)) {
          for (const vv of v) values.add(String(vv).trim());
        } else {
          values.add(String(v).trim());
        }
      }
      if (values.size === 0) continue;
      const displays = Array.from(values).filter(s => s.length > 0);
      const display = displays.length <= 1 ? displays[0] : displays.join("; ");
      merged.push({ k: key, display, values: displays });
    }
    return merged;
  }

  const [selectedQueryVariant, setSelectedQueryVariant] = useState({});
  // editState: { [rowIndex]: { context?: string, referenced_answer?: string } }
  const [editState, setEditState] = useState({});
  // draftState: { [rowIndex]: { context?: string, referenced_answer?: string } } — in-progress edits
  const [draftState, setDraftState] = useState({});
  // which cell is open for editing: { rowIndex, field } | null
  const [editingCell, setEditingCell] = useState(null);

  function getDisplayValue(i, field, item) {
    if (editState[i]?.[field] !== undefined) return editState[i][field];
    if (field === "context") return item.context ?? "";
    return item.referenced_answer ?? item.expected_answer ?? "";
  }

  function openEdit(i, field, item) {
    setDraftState(prev => ({
      ...prev,
      [i]: { ...prev[i], [field]: getDisplayValue(i, field, item) },
    }));
    setEditingCell({ i, field });
  }

  function confirmEdit(i, field) {
    const val = draftState[i]?.[field];
    if (val !== undefined) {
      setEditState(prev => ({
        ...prev,
        [i]: { ...prev[i], [field]: val },
      }));
    }
    setEditingCell(null);
  }

  function handleSubmit() {
    const edits = Object.entries(editState)
      .map(([idx, fields]) => ({ index: Number(idx), ...fields }))
      .filter(e => e.context !== undefined || e.referenced_answer !== undefined);
    const doSubmit = async () => {
      if (edits.length > 0) {
        await fetch(`https://${BACKEND_URL}/submit-reference-edits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataset_name: dataset, edits }),
        });
        localStorage.setItem('rcaSubmitted', JSON.stringify({ controlGroup }));
      }
      window.close();
    };
    doSubmit();
  }

  const editBtnStyle = {
    marginLeft: "8px",
    fontSize: "0.72rem",
    padding: "4px 10px",
    background: T.color.surfaceSunk,
    border: `1px solid ${T.color.border}`,
    borderRadius: T.radius.sm,
    cursor: "pointer",
    color: T.color.textMuted,
    fontWeight: 600,
    flexShrink: 0,
  };
  const confirmBtnStyle = {
    marginTop: "8px",
    fontSize: "0.78rem",
    padding: "6px 14px",
    background: T.color.brand,
    border: "none",
    borderRadius: T.radius.sm,
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600,
  };

  function EditableCell({ i, field, item, style }) {
    const isEditing = editingCell?.i === i && editingCell?.field === field;
    const displayVal = getDisplayValue(i, field, item);
    const isEdited = editState[i]?.[field] !== undefined;
    if (isEditing) {
      return (
        <td style={style}>
          <textarea
            value={draftState[i]?.[field] ?? ""}
            onChange={e => setDraftState(prev => ({
              ...prev,
              [i]: { ...prev[i], [field]: e.target.value },
            }))}
            style={{
              width: "100%",
              minHeight: "90px",
              fontSize: "0.85rem",
              boxSizing: "border-box",
              padding: "8px 10px",
              lineHeight: 1.5,
              resize: "vertical",
            }}
            autoFocus
          />
          <button style={confirmBtnStyle} onClick={() => confirmEdit(i, field)}>
            Confirm
          </button>
        </td>
      );
    }
    return (
      <td style={style}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEdited && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.68rem",
                color: T.color.success,
                fontWeight: 600,
                marginBottom: "4px",
                padding: "1px 8px",
                borderRadius: T.radius.pill,
                background: T.color.successSoft,
                letterSpacing: "0.02em",
              }}>
                Edited
              </div>
            )}
            <ExpandableText text={displayVal} />
          </div>
          <button style={editBtnStyle} onClick={() => openEdit(i, field, item)}>Edit</button>
        </div>
      </td>
    );
  }

  return (
    <div style={{
      padding: "40px 48px",
      fontFamily: T.font.sans,
      background: T.color.bg,
      color: T.color.text,
      height: "100vh", overflowY: "auto", overflowX: "auto", boxSizing: "border-box",
    }}>
      <h1 style={{
        color: T.color.brandText,
        margin: "0 0 8px 0",
        fontSize: "1.75rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
      }}>
        Re-evaluation list
      </h1>
      <p style={{ margin: "0 0 32px 0", color: T.color.textMuted, fontSize: "0.95rem" }}>
        Review flagged records and edit references inline. Submit when done.
      </p>

      {reEvalRows.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{
            color: T.color.danger,
            margin: "0 0 16px 0",
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span aria-hidden>⚠</span>
            Records suggested for re-evaluation
          </h2>
          <div style={{
            position: "relative",
            border: `1px solid ${T.color.border}`,
            borderRadius: T.radius.lg,
            background: T.color.surface,
            overflow: "hidden",
            boxShadow: T.shadow.sm,
          }}>
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", minWidth: "1200px", fontSize: "0.85rem", width: "100%" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <tr style={{ background: T.color.brandSoft }}>
                    {[
                      { label: "#",                                        minW: "40px"  },
                      { label: "Query",                                    minW: "180px" },
                      { label: "Referenced Content",                       minW: "200px" },
                      { label: "Retrieved Content",                        minW: "200px" },
                      { label: "Referenced Answer",                        minW: "180px" },
                      { label: `AI Answer (${controlLabel})`,              minW: "180px" },
                      { label: "Retrieval Quality",                        minW: "110px" },
                      { label: "Answer Quality",                           minW: "110px" },
                      { label: "Suggestions",                              minW: "260px" },
                    ].map(({ label, minW }) => (
                      <th key={label} style={{
                        borderBottom: `1px solid ${T.color.border}`,
                        padding: "12px 14px",
                        textAlign: "left",
                        whiteSpace: "pre-line",
                        color: T.color.brandText,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        minWidth: minW,
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reEvalRows.map(({ item, i }) => {
                    const suggestions = getControlSuggestions(item.root_cause_analysis);

                    const cellStyle = {
                      borderBottom: `1px solid ${T.color.border}`,
                      padding: "12px 14px",
                      verticalAlign: "top",
                      wordBreak: "break-word",
                      background: i % 2 === 0 ? T.color.surface : T.color.surfaceMuted,
                      color: T.color.text,
                      lineHeight: 1.55,
                    };
                    return (
                      <tr key={i}>
                        <td style={cellStyle}>{i + 1}</td>
                        <td style={cellStyle}>{item.query}</td>
                        <EditableCell i={i} field="context" item={item} style={cellStyle} />
                        <ExpandableCell text={item.retrieved_content} style={cellStyle} />
                        <EditableCell i={i} field="referenced_answer" item={item} style={cellStyle} />
                        <td style={cellStyle}><ExpandableText text={item.ai_answer} /></td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          <span style={{ color: SCORE_COLORS[String(item.new_retrieval_quality_score)] || "#333" }}>
                            {item.new_retrieval_quality_score}
                          </span>
                        </td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          <span style={{ color: SCORE_COLORS[String(item.new_answer_quality_score)] || "#333" }}>
                            {item.new_answer_quality_score}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          {suggestions.map(({ k, display, values }, j) => {
                            if (k === "Please review query quality") {
                              const opts = values || (display ? [display] : []);
                              return (
                                <div key={j} style={{ marginBottom: "4px" }}>
                                  <em style={{ color: "#800000" }}>{k}:</em>
                                  <div style={{ marginTop: "6px" }}>
                                    {opts.map((opt, idxOpt) => (
                                      <label key={idxOpt} style={{ display: "block", cursor: "pointer" }}>
                                        <input
                                          type="checkbox"
                                          checked={selectedQueryVariant[i] === opt}
                                          onChange={() => setSelectedQueryVariant(prev => {
                                            const cur = prev[i] === opt ? undefined : opt;
                                            return { ...prev, [i]: cur };
                                          })}
                                          style={{ marginRight: "8px" }}
                                        />
                                        {opt}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div key={j} style={{ marginBottom: "4px" }}>
                                <em style={{ color: "#800000" }}>{k}:</em> {display}
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
        <button
          onClick={handleSubmit}
          style={{
            background: T.color.brand,
            color: "#fff",
            border: "none",
            borderRadius: T.radius.md,
            padding: "12px 32px",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(128,0,0,0.20)",
            letterSpacing: "0.01em",
          }}
        >
          Submit changes
        </button>
      </div>
    </div>
  );
}
