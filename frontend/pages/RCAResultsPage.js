import { useState, useEffect } from "react";
import { T, useFonts } from "../theme";
import { BACKEND_URL, SCORE_COLORS } from "../constants";
import { ExpandableText, Spinner } from "../components/common";
import { Stepper } from "../components/Stepper";

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
      <Spinner size={20} />
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

  // editState: { [rowIndex]: { context?: string, referenced_answer?: string } }
  const [editState, setEditState] = useState({});
  // draftState: in-progress edits, same shape
  const [draftState, setDraftState] = useState({});
  // which field is open for editing in the modal: { i, field, label } | null
  const [editingCell, setEditingCell] = useState(null);

  function getDisplayValue(i, field, item) {
    if (editState[i]?.[field] !== undefined) return editState[i][field];
    if (field === "context") return item.context ?? "";
    return item.referenced_answer ?? item.expected_answer ?? "";
  }

  function openEdit(i, field, item, label) {
    setDraftState(prev => ({
      ...prev,
      [i]: { ...prev[i], [field]: getDisplayValue(i, field, item) },
    }));
    setEditingCell({ i, field, label });
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

  function closeEdit() {
    setEditingCell(null);
  }

  // Close the edit modal on Escape.
  useEffect(() => {
    if (!editingCell) return;
    const onKey = (e) => { if (e.key === "Escape") setEditingCell(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingCell]);

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

  const rowEdited = (i) =>
    !!editState[i] && (editState[i].context !== undefined || editState[i].referenced_answer !== undefined);
  const editedCount = reEvalRows.filter(({ i }) => rowEdited(i)).length;

  // ── shared styling ───────────────────────────────────────────────────────
  const MAXW = "900px";
  const paneLabel = {
    fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", color: T.color.textSubtle,
  };
  const paneBody = { fontSize: "0.88rem", lineHeight: 1.55, color: T.color.text };
  const paneBox = (editable) => ({
    flex: "1 1 260px", minWidth: 0, boxSizing: "border-box",
    background: editable ? T.color.surfaceMuted : T.color.surface,
    border: `1px solid ${T.color.border}`,
    borderRadius: T.radius.md, padding: "12px 14px",
  });

  // ── render helpers (plain functions, not components — keeps the edit
  //    textarea from remounting on every keystroke) ──────────────────────────
  const scoreChip = (label, score) => (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
      fontSize: "0.72rem", fontWeight: 600, color: T.color.textMuted,
      background: T.color.surfaceSunk, border: `1px solid ${T.color.border}`,
      borderRadius: T.radius.pill, padding: "4px 10px",
    }}>
      <span style={{
        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
        background: SCORE_COLORS[String(score)] || T.color.textSubtle,
      }} />
      {label}<b style={{ color: T.color.text }}>{score}</b>
    </span>
  );

  const readPane = (label, text) => (
    <div style={paneBox(false)}>
      <div style={{ marginBottom: "7px" }}><span style={paneLabel}>{label}</span></div>
      <div style={paneBody}><ExpandableText text={text} /></div>
    </div>
  );

  const editablePane = (i, field, item, label) => {
    const isEdited = editState[i]?.[field] !== undefined;
    return (
      <div style={paneBox(true)}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
          <span style={paneLabel}>{label}</span>
          {isEdited && (
            <span style={{
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.04em",
              padding: "1px 8px", borderRadius: T.radius.pill,
              background: T.color.successSoft, color: T.color.success,
            }}>
              Edited
            </span>
          )}
          <button
            onClick={() => openEdit(i, field, item, label)}
            style={{
              marginLeft: "auto", fontSize: "0.72rem", fontWeight: 600,
              padding: "3px 12px", borderRadius: T.radius.sm, cursor: "pointer",
              background: T.color.surface, border: `1px solid ${T.color.borderStrong}`,
              color: T.color.textMuted, flexShrink: 0,
            }}
          >
            Edit
          </button>
        </div>
        <div style={paneBody}><ExpandableText text={getDisplayValue(i, field, item)} /></div>
      </div>
    );
  };

  // Centred edit dialog — long references get real room, away from the cramped
  // card column. Kept as a plain function so the textarea keeps focus while typing.
  const editModal = () => {
    if (!editingCell) return null;
    const { i, field, label } = editingCell;
    const query = controlItems[i]?.query || "";
    return (
      <div
        onMouseDown={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px", boxSizing: "border-box",
          background: "rgba(17, 13, 28, 0.55)",
          backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
          animation: "fadeIn 140ms var(--ease-out-quart) both",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${label.toLowerCase()}`}
          style={{
            width: "100%", maxWidth: "640px", maxHeight: "calc(100vh - 48px)",
            display: "flex", flexDirection: "column", boxSizing: "border-box",
            background: T.color.surface,
            border: `1px solid ${T.color.border}`,
            borderRadius: T.radius.lg,
            boxShadow: T.shadow.lg,
            animation: "fadeInScale 180ms var(--ease-out-expo) both",
          }}
        >
          {/* header */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "14px",
            padding: "20px 22px 16px", borderBottom: `1px solid ${T.color.border}`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                margin: 0, fontSize: "1.05rem", fontWeight: 700,
                color: T.color.text, letterSpacing: "-0.01em",
              }}>
                Edit {label.toLowerCase()}
              </h3>
              {query && (
                <p style={{
                  margin: "5px 0 0", fontSize: "0.84rem", lineHeight: 1.45,
                  color: T.color.textMuted,
                }}>
                  {query}
                </p>
              )}
            </div>
            <button
              onClick={closeEdit}
              aria-label="Close"
              className="icon-btn"
              style={{
                flexShrink: 0, display: "inline-flex", alignItems: "center",
                justifyContent: "center", width: "30px", height: "30px",
                borderRadius: T.radius.sm, cursor: "pointer", padding: 0,
                background: T.color.surface, border: `1px solid ${T.color.border}`,
                color: T.color.textMuted, fontSize: "0.95rem", lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* body */}
          <div style={{ padding: "18px 22px", overflowY: "auto" }}>
            <textarea
              value={draftState[i]?.[field] ?? ""}
              onChange={(e) => setDraftState(prev => ({
                ...prev, [i]: { ...prev[i], [field]: e.target.value },
              }))}
              autoFocus
              style={{
                width: "100%", minHeight: "300px", boxSizing: "border-box",
                fontSize: "0.9rem", lineHeight: 1.6, padding: "12px 14px",
                resize: "vertical", borderRadius: T.radius.md,
              }}
            />
          </div>

          {/* footer */}
          <div style={{
            display: "flex", justifyContent: "flex-end", gap: "10px",
            padding: "14px 22px", borderTop: `1px solid ${T.color.border}`,
          }}>
            <button
              onClick={closeEdit}
              style={{
                fontSize: "0.86rem", fontWeight: 600, cursor: "pointer",
                padding: "9px 18px", borderRadius: T.radius.md,
                background: T.color.surface, border: `1px solid ${T.color.borderStrong}`,
                color: T.color.textMuted,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => confirmEdit(i, field)}
              style={{
                fontSize: "0.86rem", fontWeight: 600, cursor: "pointer",
                padding: "9px 20px", borderRadius: T.radius.md,
                background: T.color.brand, color: T.color.onColorLight, border: "none",
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      fontFamily: T.font.sans, background: T.color.bg, color: T.color.text,
      width: "100%", height: "100vh", overflowY: "auto", boxSizing: "border-box",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        flex: 1, width: "100%", maxWidth: MAXW, margin: "0 auto",
        padding: "40px 24px 48px", boxSizing: "border-box",
      }}>
        <Stepper active={3} style={{ justifyContent: "flex-start", marginBottom: "28px" }} />

        <h1 style={{
          color: T.color.brandText, margin: "0 0 6px",
          fontSize: "1.7rem", fontWeight: 700, letterSpacing: "-0.02em",
        }}>
          Re-evaluation queue
        </h1>
        <p style={{ margin: "0 0 22px", color: T.color.textMuted, fontSize: "0.95rem", lineHeight: 1.5 }}>
          {controlLabel} flagged {reEvalRows.length} record{reEvalRows.length === 1 ? "" : "s"} where the
          ground truth may be stale. Review each one, edit the reference if it&apos;s wrong, then submit.
        </p>

        {reEvalRows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "26px" }}>
            <div style={{
              flex: "0 0 150px", height: "6px", overflow: "hidden",
              background: T.color.surfaceSunk, borderRadius: T.radius.pill,
            }}>
              <div style={{
                width: `${(editedCount / reEvalRows.length) * 100}%`, height: "100%",
                background: T.color.sage, borderRadius: T.radius.pill,
                transition: "width 220ms var(--ease-out-quart)",
              }} />
            </div>
            <span style={{ fontSize: "0.82rem", color: T.color.textMuted }}>
              {editedCount} of {reEvalRows.length} edited
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {reEvalRows.map(({ item, i }, qIndex) => {
            const suggestions = getControlSuggestions(item.root_cause_analysis);
            const qq = suggestions.find(s => s.k === "Please review query quality");
            const flagText = suggestions
              .filter(s => s.k !== "Please review query quality")
              .map(s => s.display).filter(Boolean).join(" ");
            const variants = qq ? (qq.values && qq.values.length ? qq.values : (qq.display ? [qq.display] : [])) : [];
            const diagnosis = flagText
              || (variants.length ? "This query was flagged as unclear — clearer rephrasings are suggested below." : "");

            return (
              <article key={i} style={{
                background: T.color.surface,
                border: `1px solid ${rowEdited(i) ? T.color.sage : T.color.border}`,
                borderRadius: T.radius.lg,
                boxShadow: T.shadow.sm,
                padding: "20px 22px",
                display: "flex", flexDirection: "column", gap: "14px",
              }}>
                {/* top — number · query · scores */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: T.font.mono, fontSize: "0.78rem", fontWeight: 600,
                    color: T.color.textSubtle, background: T.color.surfaceSunk,
                    borderRadius: T.radius.sm, padding: "3px 8px", flexShrink: 0,
                  }}>
                    {String(qIndex + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                    <div style={{ ...paneLabel, marginBottom: "3px" }}>Query</div>
                    <div style={{ fontSize: "1.02rem", fontWeight: 600, color: T.color.text, lineHeight: 1.4 }}>
                      {item.query}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {scoreChip("Retrieval", item.new_retrieval_quality_score)}
                    {scoreChip("Answer", item.new_answer_quality_score)}
                  </div>
                </div>

                {/* why it's flagged */}
                {diagnosis && (
                  <div style={{
                    display: "flex", gap: "10px", alignItems: "flex-start",
                    background: T.color.warningSoft, border: `1px solid ${T.color.saffron}`,
                    borderRadius: T.radius.md, padding: "11px 14px",
                  }}>
                    <span aria-hidden style={{
                      flexShrink: 0, width: "18px", height: "18px", borderRadius: "50%",
                      background: T.color.saffron, color: T.color.onColorDark,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.72rem", fontWeight: 800,
                    }}>!</span>
                    <span style={{ fontSize: "0.86rem", lineHeight: 1.5, color: T.color.text }}>
                      <b>Why it&apos;s flagged.</b> {diagnosis}
                    </span>
                  </div>
                )}

                {/* reference answer (editable) vs AI answer */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {editablePane(i, "referenced_answer", item, "Reference answer")}
                  {readPane(`AI answer · ${controlLabel}`, item.ai_answer)}
                </div>

                {/* query-quality rephrasings — read-only guidance, not an input */}
                {variants.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    <div style={paneLabel}>Suggested rephrasings</div>
                    {variants.map((opt, oi) => (
                      <div key={oi} style={{
                        display: "flex", gap: "9px", alignItems: "flex-start",
                        fontSize: "0.88rem", lineHeight: 1.5, color: T.color.text,
                        background: T.color.surfaceMuted,
                        border: `1px solid ${T.color.border}`,
                        borderRadius: T.radius.md, padding: "9px 12px",
                      }}>
                        <span aria-hidden style={{ color: T.color.textSubtle, flexShrink: 0, fontWeight: 600 }}>›</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* retrieved + referenced content — secondary, collapsed */}
                <details>
                  <summary style={{
                    cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                    color: T.color.brandText,
                  }}>
                    Show retrieved &amp; referenced content
                  </summary>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
                    {editablePane(i, "context", item, "Referenced content")}
                    {readPane("Retrieved content", item.retrieved_content)}
                  </div>
                </details>
              </article>
            );
          })}
        </div>

        {reEvalRows.length === 0 && (
          <div style={{
            border: `1px solid ${T.color.border}`, borderRadius: T.radius.lg,
            background: T.color.surface, padding: "40px", textAlign: "center",
            color: T.color.textMuted, fontSize: "0.95rem",
          }}>
            No records were flagged for re-evaluation.
          </div>
        )}
      </div>

      {/* sticky submit bar — keeps the goal in view while scrolling the queue */}
      <div style={{
        position: "sticky", bottom: 0,
        background: T.color.surface, borderTop: `1px solid ${T.color.border}`,
        boxShadow: T.shadow.up,
      }}>
        <div style={{
          maxWidth: MAXW, margin: "0 auto", padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
        }}>
          <span style={{ fontSize: "0.86rem", color: T.color.textMuted }}>
            {reEvalRows.length} record{reEvalRows.length === 1 ? "" : "s"}
            {" · "}
            <b style={{ color: T.color.text }}>{editedCount} edited</b>
          </span>
          <button
            onClick={handleSubmit}
            style={{
              background: T.color.brand, color: T.color.onColorLight, border: "none",
              borderRadius: T.radius.md, padding: "11px 28px",
              fontSize: "0.92rem", fontWeight: 600, cursor: "pointer",
              boxShadow: T.shadow.md, letterSpacing: "0.01em",
            }}
          >
            Submit changes
          </button>
        </div>
      </div>

      {editModal()}
    </div>
  );
}
