# Investigation: RCA submit → Page 2 flow

Two symptoms were reported after submitting the re-evaluation queue on Page 3
(`RCAResultsPage.js`) and returning to Page 2 (`ABTestPage.js`):

1. The settings card label never reflects that RAG 2 became the new control.
2. The re-run shows "No significant difference".

## Symptom 1 — settings card label does not update — **GENUINE BUG (fixed)**

### Trace

- Page 3 is opened in a **separate browser tab** via
  `window.open(...?view=rca..., '_blank')` (`ABTestPage.js`).
- On Submit, `RCAResultsPage.handleSubmit` writes
  `localStorage.setItem('rcaSubmitted', JSON.stringify({ controlGroup }))`
  (only when there is at least one reference/context edit).
- Page 2's `storage` listener fires correctly. `storage` events are dispatched
  to **other** same-origin documents, and Page 3 is a different tab — so this
  works. (It would *not* fire for same-tab navigation, but that is not how this
  flow works, so it is a non-issue here.) The listener sets `pendingSwap`.
- `pendingSwap` makes `newABTestReady` true, which runs the "eager-update"
  effect. When `controlGroup === 'rag2'` that effect copies RAG 2's config
  (`rag2Model/TopN/SemanticWeight/AGLLM`) into the `rag1*` state.

So the **config swap genuinely persists** — the left/control pane really does
hold RAG 2's settings after submit, and the subsequent re-run uses them.

### Root cause

The swap of *values* worked, but the **label could never change**:

- `ABTestPage.js` passed a hardcoded string prop
  `title="Control Group: RAG 1 Settings"` to the left `RAGSettings`.
- `RAGSettings.js` rendered its heading as
  `{isControl ? "RAG 1 Settings" : "RAG 2 Settings"}` — derived purely from
  whether the title contains "Control", **not** from the RAG identity. Even a
  dynamic title prop would have been ignored.
- Nothing in `ABTestPage` tracked the fact that RAG 2 had been promoted to the
  control slot, so there was no state for the heading to react to.

Result: after submit, the control card showed RAG 2's *values* under the
heading "RAG 1 Settings" — exactly the reported symptom.

### Fix (minimal, targeted)

- `ABTestPage.js`: added `controlGroupName` state (default `"RAG 1"`). The
  eager-update effect now sets it to `"RAG 2"` in the same branch where it
  copies RAG 2's config into the control pane. The left `RAGSettings` receives
  `title={`Control Group: ${controlGroupName} Settings`}`. Because the state is
  not derived from the transient `pendingSwap`, the label persists through the
  re-run and across further rounds.
- `RAGSettings.js`: the heading now derives from the `title` prop
  (`title.split(": ")[1]`) instead of a hardcoded ternary, so it reflects the
  live RAG identity. The right/test pane is unchanged (`"RAG 2 Settings"`).

After the fix the control card flips to "RAG 2 Settings" on submit, alongside
the existing "✓ Updated to new control settings" banner — making it clear which
configuration became the new baseline.

## Symptom 2 — "No significant difference" — **WORKING AS INTENDED (no code change)**

### Trace

- The verdict comes from `computeAQCI` (`stats.js`): a paired two-tailed 95% t
  confidence interval over the per-question `new_answer_quality_score`
  differences. "No significant difference" is shown when the CI straddles 0.
- The user applied a **bare-minimum** change (one suggested query rephrasing).
- Reference-answer / context edits *do* persist into the re-run:
  `/submit-reference-edits` patches `raw_datasets`, updates the in-memory
  `rag_data`, and truncates `existing_auto_eval_output` / `existing_rca_output`.
  `eval_one_config` always re-merges `context` + `ground_truth` from `rag_df`,
  so the re-evaluation uses the fresh references.

### Conclusion

A single changed record cannot move a paired-t CI across ~N questions to
statistical significance — the mean difference stays near zero and the interval
keeps spanning 0. So **"No significant difference" is the statistically correct
result for a bare-minimum change**, not a bug. No code change was made for this.

## Follow-up recommendation (latent gap, not fixed)

The "Suggested rephrasings" radio selection (`selectedQueryVariant` in
`RCAResultsPage.js`) is **never submitted**. `handleSubmit` builds its payload
from `editState` only, and the backend has no path for a rephrased query:
`DataOverride` carries only `index/context/referenced_answer`, and the
`question` field of `raw_datasets` is never updated.

This was **not** the cause of either reported symptom — even if a rephrasing
were applied, a one-query change would still yield "No significant difference"
(Symptom 2), and Symptom 1 is purely a labelling bug. It is left unfixed
deliberately: wiring it up is a feature, not a minimal bug fix, and would need
backend work (a new override field, a `{question}` `jsonb_set`, and
invalidation of `existing_rag_output`, which is keyed only on RAG config and
would otherwise serve stale retrieval/answers for the changed query).

Recommended next step: either implement query-rephrasing persistence end to
end, or remove/disable the radio control so it does not imply an effect it
does not have.

## Files changed

- `frontend/pages/ABTestPage.js` — `controlGroupName` state; dynamic control
  card `title`.
- `frontend/components/RAGSettings.js` — heading derived from the `title` prop.
