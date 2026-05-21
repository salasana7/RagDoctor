import { T } from "../theme";
import { Spinner } from "./common";

// ─── Live activity log ────────────────────────────────────────────────────────
// Renders the real backend execution stages — streamed in through job-status
// polling — as a terminal-style log. Completed stages get a check; the newest
// stage shows a small glowing spinner. Each line is appended by the backend as
// work genuinely happens, so the log can never run ahead of the server.
export function ActivityLog({ stages }) {
  if (!stages || stages.length === 0) return null;
  return (
    <div style={{
      width: "100%",
      maxWidth: "460px",
      margin: "0 auto",
      textAlign: "left",
      background: T.color.surfaceSunk,
      border: `1px solid ${T.color.border}`,
      borderRadius: T.radius.md,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {stages.map((s, i) => {
        // The list only ever grows by appending, so index keys are stable —
        // earlier rows keep their DOM nodes (no re-animation) while the freshly
        // appended row mounts and fades in, giving the streaming feel.
        const isActive = i === stages.length - 1;
        return (
          <div
            key={i}
            className="enter-up"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontFamily: T.font.mono,
              fontSize: "0.78rem",
              lineHeight: 1.45,
              color: isActive ? T.color.text : T.color.textMuted,
            }}
          >
            <span aria-hidden style={{
              flexShrink: 0,
              width: "13px",
              height: "13px",
              marginTop: "1px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {isActive ? (
                <Spinner size={11} thickness={2} head={T.color.brand} speed={0.7} />
              ) : (
                <span style={{ color: T.color.sage, fontWeight: 700, fontSize: "0.86rem" }}>✓</span>
              )}
            </span>
            <span>{s.message}</span>
          </div>
        );
      })}
    </div>
  );
}
