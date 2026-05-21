import { useState } from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { T } from "../theme";
import { SCORE_COLORS, SCORE_INK } from "../constants";

// Round-number axis scale: returns evenly-spaced "nice" ticks (0, 10, 20, 30…)
// and the domain max to scale bars against.
function niceScale(max, targetCount = 5) {
  if (!(max > 0)) return { ticks: [0, 1], niceMax: 1 };
  const rawStep = max / (targetCount - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 2.5) step = 2.5;
  else if (norm <= 5) step = 5;
  else step = 10;
  step *= mag;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let t = 0; t <= niceMax + 1e-9; t += step) {
    ticks.push(Math.round(t * 1000) / 1000);
  }
  return { ticks, niceMax };
}

export function EvalStackedBarChart({ title, rag1Counts, rag2Counts, scoreDefinitions }) {
  const [hover, setHover] = useState(null);
  if (!rag1Counts && !rag2Counts) return null;

  const allScores = Array.from(
    new Set([
      ...Object.keys(rag1Counts || {}),
      ...Object.keys(rag2Counts || {}),
    ])
  ).sort((a, b) => Number(a) - Number(b));

  const data = [
    { name: "RAG 1", ...(rag1Counts || {}) },
    { name: "RAG 2", ...(rag2Counts || {}) },
  ];
  const totals = data.map(d => allScores.reduce((sum, score) => sum + (Number(d[score]) || 0), 0));
  const grandTotal = totals.reduce((a, b) => a + b, 0);
  const definitionByScore = Object.fromEntries((scoreDefinitions || []).map(d => [String(d.score), d.label]));
  // Legend always shows the full possible score scale so both charts have identical content height.
  const legendScores = (scoreDefinitions && scoreDefinitions.length)
    ? scoreDefinitions.map(d => String(d.score))
    : allScores;

  // Vertical bar geometry
  const BAR_W = 64;
  const BAR_GAP = 56;
  const MARGIN = { top: 12, right: 16, bottom: 36, left: 44 };
  const PLOT_H = 240;
  const HEIGHT = MARGIN.top + PLOT_H + MARGIN.bottom;
  const CORNER = 4;
  const SEG_GAP = 1.5;

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      width: "100%",
      height: "100%",
      background: T.color.surface,
      border: `1px solid ${T.color.border}`,
      borderRadius: T.radius.xl,
      padding: "20px 22px",
      boxShadow: T.shadow.sm,
      position: "relative",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ marginBottom: "12px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
        <h3 style={{
          margin: 0,
          fontSize: "0.98rem",
          fontWeight: 700,
          color: T.color.text,
          letterSpacing: "-0.01em",
        }}>
          {title}
        </h3>
        <div style={{
          fontFamily: T.font.mono,
          fontSize: "0.68rem",
          color: T.color.textSubtle,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          {grandTotal} records
        </div>
      </div>

      {/* Legend — shows the full possible score scale so cards align */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 14px",
        marginBottom: "16px",
        fontFamily: T.font.mono,
        fontSize: "0.7rem",
        color: T.color.textMuted,
      }}>
        {legendScores.map(score => {
          const present = allScores.includes(String(score));
          const swatch = SCORE_COLORS[score] || T.color.textSubtle;
          return (
            <div key={score} style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: present ? T.color.textMuted : T.color.textSubtle,
            }}>
              <span style={{
                display: "inline-block",
                width: "9px",
                height: "9px",
                borderRadius: "2px",
                background: present ? swatch : "transparent",
                border: present ? "none" : `1px solid ${T.color.borderStrong}`,
                boxSizing: "border-box",
              }} />
              <span>score {score}</span>
            </div>
          );
        })}
      </div>

      <ParentSize>
        {({ width }) => {
          if (!width) return null;
          const innerW = width - MARGIN.left - MARGIN.right;
          const maxTotal = Math.max(...totals, 1);
          const { ticks, niceMax } = niceScale(maxTotal);

          // Center the bar group horizontally within the inner plot
          const totalBarSpan = BAR_W * data.length + BAR_GAP * (data.length - 1);
          const startX = Math.max(0, (innerW - totalBarSpan) / 2);

          const yScale = scaleLinear({ domain: [0, niceMax], range: [PLOT_H, 0] });

          return (
            <svg width={width} height={HEIGHT} style={{ overflow: "visible", display: "block" }}>
              <Group left={MARGIN.left} top={MARGIN.top}>
                {/* Horizontal grid + y-axis tick labels */}
                {ticks.map((t, i) => (
                  <g key={`grid-${i}`}>
                    <line
                      x1={0} x2={innerW}
                      y1={yScale(t)} y2={yScale(t)}
                      strokeDasharray={i === 0 ? "" : "2 4"}
                      style={{ stroke: T.color.border }}
                    />
                    <text
                      x={-10}
                      y={yScale(t)}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontFamily={T.font.mono}
                      fontSize={10}
                      letterSpacing="0.04em"
                      style={{ fill: T.color.textSubtle }}
                    >
                      {t}
                    </text>
                  </g>
                ))}

                {/* Columns */}
                {data.map((row, colIdx) => {
                  const colX = startX + colIdx * (BAR_W + BAR_GAP);
                  const rowTotal = totals[colIdx];

                  // Build segments stacked bottom→top in ascending score order
                  const segments = [];
                  let cursorValue = 0;
                  allScores.forEach((score) => {
                    const value = Number(row[score]) || 0;
                    if (value <= 0) return;
                    const y0 = yScale(cursorValue);
                    cursorValue += value;
                    const y1 = yScale(cursorValue);
                    segments.push({ score, value, y: y1, h: y0 - y1 });
                  });

                  return (
                    <g key={`col-${row.name}`}>
                      {/* Empty-column placeholder */}
                      {rowTotal === 0 && (
                        <rect
                          x={colX}
                          y={yScale(0) - 4}
                          width={BAR_W}
                          height={4}
                          rx={2}
                          style={{ fill: T.color.surfaceSunk }}
                        />
                      )}

                      {/* Segments — first is BOTTOM, last is TOP */}
                      {segments.map((seg, segIdx) => {
                        const isBottom = segIdx === 0;
                        const isTop = segIdx === segments.length - 1;
                        const segH = Math.max(2, seg.h - (isTop ? 0 : SEG_GAP));
                        const segY = seg.y;
                        const path = roundedSegmentPath(
                          colX, segY, BAR_W, segH,
                          isTop ? CORNER : 0,
                          isTop ? CORNER : 0,
                          isBottom ? CORNER : 0,
                          isBottom ? CORNER : 0
                        );
                        const cx = colX + BAR_W / 2;
                        const cy = segY + segH / 2;
                        const segId = `${colIdx}-${seg.score}`;
                        const isHovered = hover?.id === segId;
                        const fill = SCORE_COLORS[seg.score] || T.color.textSubtle;
                        const pct = Math.round((seg.value / rowTotal) * 100);
                        // Bottom segment grows last so the stack reads from bottom up
                        const enterDelay = colIdx * 110 + segIdx * 70;
                        return (
                          <g
                            key={segId}
                            style={{
                              transformOrigin: `${cx}px ${cy}px`,
                              transition: "transform 180ms var(--ease-out-quart), filter 180ms var(--ease-out-quart)",
                              transform: isHovered ? "translateX(2px)" : "translateX(0)",
                              filter: hover && !isHovered ? "saturate(0.6) opacity(0.5)" : "none",
                              animation: `segGrowUp 520ms var(--ease-out-expo) ${enterDelay}ms both`,
                            }}
                            onMouseEnter={() => {
                              setHover({
                                id: segId,
                                score: seg.score,
                                value: seg.value,
                                pct,
                                row: row.name,
                                x: cx + MARGIN.left,
                                y: cy + MARGIN.top - 12,
                              });
                            }}
                            onMouseLeave={() => setHover(null)}
                          >
                            <path d={path} style={{ fill }} />
                            {segH > 18 && (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontFamily={T.font.mono}
                                fontSize={11}
                                fontWeight={600}
                                style={{ pointerEvents: "none", letterSpacing: "0.02em", fill: SCORE_INK[seg.score] }}
                              >
                                {seg.value}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Column label */}
                      <text
                        x={colX + BAR_W / 2}
                        y={PLOT_H + 18}
                        textAnchor="middle"
                        fontFamily={T.font.sans}
                        fontSize={13}
                        fontWeight={600}
                        style={{ fill: T.color.text }}
                      >
                        {row.name}
                      </text>
                      <text
                        x={colX + BAR_W / 2}
                        y={PLOT_H + 31}
                        textAnchor="middle"
                        fontFamily={T.font.mono}
                        fontSize={10}
                        letterSpacing="0.04em"
                        style={{ fill: T.color.textSubtle }}
                      >
                        n={rowTotal}
                      </text>
                    </g>
                  );
                })}
              </Group>
            </svg>
          );
        }}
      </ParentSize>

      {hover && (
        <div style={{
          position: "absolute",
          left: hover.x,
          top: hover.y,
          transform: "translate(-50%, -100%)",
          background: T.color.surface,
          color: T.color.text,
          border: `1px solid ${T.color.border}`,
          borderRadius: T.radius.sm,
          padding: "8px 12px",
          fontSize: "0.78rem",
          lineHeight: 1.45,
          boxShadow: T.shadow.lg,
          pointerEvents: "none",
          zIndex: 50,
          maxWidth: "260px",
          animation: "fadeInScale 140ms var(--ease-out-quart) both",
          transformOrigin: "bottom center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: SCORE_COLORS[hover.score] }} />
            <span style={{ fontFamily: T.font.mono, letterSpacing: "0.02em" }}>{hover.row} · score {hover.score}</span>
          </div>
          <div style={{ marginTop: "4px", fontFamily: T.font.mono, color: T.color.textMuted }}>
            {hover.value} records ({hover.pct}%)
          </div>
          {definitionByScore[hover.score] && (
            <div style={{
              marginTop: "6px",
              paddingTop: "6px",
              borderTop: `1px solid ${T.color.border}`,
              color: T.color.textMuted,
              fontSize: "0.72rem",
              whiteSpace: "normal",
            }}>
              {definitionByScore[hover.score]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// SVG path for a rect with independently rounded corners (TL, TR, BR, BL).
function roundedSegmentPath(x, y, w, h, rTL, rTR, rBR, rBL) {
  if (w <= 0 || h <= 0) return "";
  const cap = (r) => Math.max(0, Math.min(r, w / 2, h / 2));
  const tl = cap(rTL), tr = cap(rTR), br = cap(rBR), bl = cap(rBL);
  const right = x + w;
  const bottom = y + h;
  return [
    `M ${x + tl} ${y}`,
    `L ${right - tr} ${y}`,
    tr ? `A ${tr} ${tr} 0 0 1 ${right} ${y + tr}` : "",
    `L ${right} ${bottom - br}`,
    br ? `A ${br} ${br} 0 0 1 ${right - br} ${bottom}` : "",
    `L ${x + bl} ${bottom}`,
    bl ? `A ${bl} ${bl} 0 0 1 ${x} ${bottom - bl}` : "",
    `L ${x} ${y + tl}`,
    tl ? `A ${tl} ${tl} 0 0 1 ${x + tl} ${y}` : "",
    "Z",
  ].filter(Boolean).join(" ");
}
