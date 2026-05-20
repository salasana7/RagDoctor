# RagDoctor Playground — UX / UI Review

A design and frontend review of the three-page web playground (`frontend/`), with
prioritized, concrete recommendations. A viewable redesign of every
recommendation here lives in `prototype/index.html`.

---

## Method

Every observation below is grounded in the real source: `App.js`,
`pages/DatasetPage.js`, `pages/ABTestPage.js`, `pages/RCAResultsPage.js`,
`theme.js`, `globals.css`, and the components in `components/`. Nothing in
`frontend/` was modified — this review and the prototype are additive only.

---

## Overall impression

The **design system is genuinely good** and should not be touched. The warm
cream palette (`--bg #FAF5E8`, `--surface #FFFCF4`), the restrained five-colour
system (burgundy / coral / saffron / sage / plum), the Inter + IBM Plex Mono
pairing, the token discipline, and full light/dark parity are all the marks of
careful work. The materials are not the problem.

The problem is **composition**. Three issues recur across all three pages:

1. **Vertical composition is top-loaded.** Content clusters at the top of the
   viewport and leaves dead space below — most visibly on the homepage.
2. **The statistical result is told, not shown.** RagDoctor's entire pitch is
   "see statistical winners," yet the numbers `computeAQCI` produces
   (`stats.js:22–40` — `meanDiff`, `ciLower`, `ciUpper`, `n`) never reach the
   screen. The user sees a sentence, not evidence.
3. **A review task is rendered as a spreadsheet.** The root-cause page is a
   9-column, 1200px-wide table when it should be a guided queue.

The fixes are all *refinement, not addition* — exactly the restraint the owner
asked for. No new features, no new decoration.

---

## 1 — Homepage (`DatasetPage.js`)

### What's wrong now

- **It is not centred.** The container uses
  `justifyContent: "flex-start"` with `padding: "72px 24px 48px"`
  (`DatasetPage.js:57,62`). The logo/tagline/card cluster is pinned to the top.
- **The primary CTA is orphaned.** "Start RAG A/B test" is not part of the
  content group — it sits in a separate `flex: 1` region with
  `paddingTop: "48px"` (`DatasetPage.js:229`). After preprocessing finishes the
  button appears far *below* the card with a wide gap, visually disconnected
  from the action that produced it. The page reads as: content at the top,
  emptiness in the middle, a stray button low down.
- **The step label is a dead end.** "Step 1 · Select a dataset"
  (`DatasetPage.js:118`) with an animated `↓` promises a sequence — Step 2,
  Step 3 — that is never shown anywhere. A first-time viewer is told they are
  at the start of something but not what.
- **Flat hierarchy.** Logo, tagline, eyebrow, card and CTA all read at similar
  visual weight. Nothing says "this card is the one thing to do."
- **Heavy chrome for one choice.** A single dataset is dressed as a full card
  *plus* a 22px radio dial. The radio implies a list to choose from; there is
  no list.
- **Loose measure.** The card sits in a `maxWidth: 640` column
  (`DatasetPage.js:84,100`) and the tagline runs to `52ch`
  (`DatasetPage.js:93`) — both a touch wide for comfortable reading and for an
  intentional, focused opening screen.

### Recommendations

| Pri | Change | Rationale |
|-----|--------|-----------|
| **P0** | **Vertically centre the whole cluster as one optical group.** Switch to `justifyContent: center`, drop the 72px top pad. Logo → tagline → steps → card → CTA become a single balanced block, nudged ~2% above true centre for optical balance. | A demo's opening screen must feel composed. Centring is the single biggest perceived-quality win and costs nothing. |
| **P0** | **Pull the CTA into the group.** Place "Start RAG A/B test" directly under the card with one rhythm step of spacing (~20px), not in a detached `flex:1` region. It should read as the natural terminus of the card. | Cause (select dataset) and effect (start test) belong next to each other. |
| **P1** | **Replace the dead-end eyebrow with a 3-step journey rail** (see §4). | Turns a broken promise into real orientation. |
| **P1** | **Establish a spacing rhythm.** Use one 4px-based scale: logo→tagline 16px, tagline→steps 28px, steps→card 28px, card→CTA 20px. Tighten the tagline measure to ~46ch and narrow the card column to ~460px. | Consistent rhythm is what separates "designed" from "assembled." |
| **P1** | **Sharpen hierarchy.** The logo is the brand, the **card is the hero**. Keep the tagline quiet (`--textMuted`), keep the journey rail quieter still (`--textSubtle`), and let the card carry the only shadow and the only saturated border on selection. | One clear focal point per screen. |
| **P2** | **Lighten the single-dataset card.** Keep the card, keep one selection affordance, but the radio can shrink and soften — it is a confirmation tick, not a chooser. Reserve the burgundy accent border purely for the selected state. | Match chrome weight to the actual decision (there is exactly one). |

The interactive DotField background stays exactly as is — it is already the
right amount of life for the page. **Do not add more.**

---

## 2 — A/B Results (`ABTestPage.js`)

This review covers the **results state** — what appears after a comparison runs.

### What's wrong now

- **The statistics are invisible.** The verdict banner
  (`ABTestPage.js:512–567`) says *"RAG 2 is statistically better than RAG 1"*
  and stops there. `computeAQCI` already computed the mean answer-quality
  difference, a 95% confidence interval and `n` — none of it is shown. For a
  product that sells statistical rigour, the rigour is hidden.
- **A double negative.** When RAG 2 loses, the banner reads "RAG 2 is **not**
  statistically better than RAG 1" with an `✕`. Negative phrasing + a failure
  glyph for what is simply *the other config winning* is hard to parse fast.
- **Result and next-action are fused.** The "New control group" pill is welded
  onto the right edge of the verdict banner (`ABTestPage.js:540–565`). "Who
  won" (a result) and "promote the winner to be the next baseline" (a forward
  action) are two different ideas crammed into one row, in jargon a first-time
  viewer won't know.
- **Asymmetric information.** The "Improvement stats" card only renders when
  `ciResult.rag2Better` is true (`ABTestPage.js:594`). If RAG 1 wins or it's a
  tie, the viewer is shown *less* — for no reason.
- **Repeated legend.** Each `EvalStackedBarChart` prints its own full score
  legend; side by side that's the same five rows twice.
- **The key action is the smallest target.** Inside the RCA card the primary
  "Run new A/B test" button is squeezed into a `flex: 0 1 220px` column pinned
  bottom-right (`ABTestPage.js:796–851`), below two stacked content blocks.
  The most important next step is the least prominent thing on screen.

### Recommendations

| Pri | Change | Rationale |
|-----|--------|-----------|
| **P0** | **Show the evidence with a confidence-interval strip.** A small horizontal number line centred on 0, with the 95% CI drawn as a bar and the mean as a marker, plus a plain readout: *"+0.42 mean gain · 95% CI [+0.11, +0.73] · n = 30."* "The interval is entirely above zero" *is* the meaning of "statistically better" — so draw it. | Makes the product's core claim visible and trustworthy in one glance. |
| **P0** | **Rewrite the verdict as a calm headline + one plain sentence.** "**RAG 2 wins**" / "**No significant difference**" — always positive framing, no `✕`. One sentence of plain English under it. | A verdict should be readable in under a second. |
| **P1** | **Separate "promote to control" from the verdict.** Move that action next to the actual *Run new A/B test* control where it belongs, and label it in plain words ("RAG 2 becomes the new baseline"). | Don't mix a result with an action. |
| **P1** | **Make the improvement stats symmetric** — always shown, describing whichever side won. | Equal information regardless of outcome. |
| **P1** | **One shared legend** above both charts; give the winning chart a quiet sage outline + a small "Winner" tag so the eye lands there first. | Removes duplication, reinforces the verdict. |
| **P1** | **Give the RCA section room and a real primary button.** Two clearly-labelled parts — *Needs review* (the actionable ground-truth fixes) and *What we learned* (the lessons) — then a full-width primary "Run new A/B test" button as the card's clear footer. | The next step should look like the next step. |
| **P2** | Order the results top-down by importance: **verdict → CI strip → distributions → improvement stats → root cause**. Headline first, evidence second, detail last. | Inverted-pyramid scanning. |

---

## 3 — Root-Cause Analysis (`RCAResultsPage.js`)

### What's wrong now

- **A review task shown as a spreadsheet.** The flagged records render as a
  9-column table with `minWidth: "1200px"` (`RCAResultsPage.js:247`). On any
  normal viewport it scrolls horizontally; the eye loses the row.
- **The diagnosis is far from the evidence.** To judge one record the reviewer
  must mentally diff "Referenced Answer" (col 5) against "AI Answer" (col 6)
  while the actual suggestion sits over in column 9. The three things that
  belong together are spread across a 1200px scroll.
- **Scores are bare coloured numerals.** `new_retrieval_quality_score` and
  `new_answer_quality_score` print as a lone digit tinted by `SCORE_COLORS`
  (`RCAResultsPage.js:299–308`). Colour alone carries the meaning (an
  accessibility problem), and "1" vs "3" means nothing to a first-time viewer
  with no label.
- **Token system bypassed.** `#800000` is hard-coded twice
  (`RCAResultsPage.js:316,337`) instead of using `--brand`/`--brandText` — so
  those labels stay burgundy in dark mode, where everything else flips.
- **Weak edit affordance.** Inline `Edit` / `Confirm` controls are tiny,
  low-contrast `0.72rem` buttons; the most important interaction on the page is
  the easiest to miss.

### Recommendations

| Pri | Change | Rationale |
|-----|--------|-----------|
| **P0** | **Replace the table with a vertical review queue of cards** — one flagged record per card, full readable width, no horizontal scroll. | Turns a spreadsheet into a guided task. This is the single biggest win on this page. |
| **P0** | **Put the diagnosis at the top of each card** as a callout ("Why it's flagged …"), then the evidence below it. | The reviewer should read *why* before *what*. |
| **P1** | **Pair "Reference answer" and "AI answer" side by side** inside the card so the diff is visual, not remembered. Keep retrieved/referenced content one tap away in a collapsible. | The comparison is the whole job — make it effortless. |
| **P1** | **Scores become labelled chips**, not bare numerals: a swatch + the number + the word ("Retrieval 1", "Answer 0"). | Meaning no longer depends on colour alone. |
| **P1** | **Promote the edit affordance** to a clear, properly-sized control, and give each card a visible state (untouched / edited / reviewed). | Progress should be legible at a glance. |
| **P2** | **Sticky submit bar** with a live count ("3 records · 1 edited"). Fix the two hard-coded `#800000` values to tokens. | Keeps the goal in view; restores dark-mode correctness. |

---

## 4 — Onboarding

### End-to-end evaluation

The journey today is: homepage labelled **"Step 1"** → A/B page (unlabelled,
but effectively *step 2*) → RCA page opened in a **new browser tab**
(effectively *step 3*). So the product genuinely *is* a three-step loop —
**select a dataset → compare two RAG setups → trace failures to root cause** —
but only the first step is named, and it is named in a way ("Step 1 ·") that
implies a visible sequence which does not exist. A first-time demo viewer lands
and cannot answer the only question that matters: *what is this, and what will
it do for me?*

### Should there be a "Step 2" on the homepage?

**No.** There is exactly one dataset; a second homepage step would be padding,
and padding is the clutter the owner rightly wants to avoid. The fix is not
*more steps* — it is **naming the journey that already exists.**

### Concrete recommendation

**Replace the dead-end "Step 1 · Select a dataset" eyebrow with a slim,
single-line, three-step journey rail:**

> **①  Select a dataset    →    ②  Compare RAG setups    →    ③  Trace the root cause**

- Step 1 active (burgundy `--brand`); steps 2–3 quiet (`--textSubtle`).
- It is one line. It **replaces** an existing element — it is *not* an
  addition.
- It does the single highest-value onboarding job: in three short phrases it
  tells the viewer the entire story *before they click anything*.
- Optionally echo the active step in the A/B page header (a muted "Step 2 of
  3") so orientation carries through.

**Do not** build a modal tour, coach-marks, tooltips or a multi-screen wizard.
That is exactly the kind of clutter to avoid. The journey rail — honest,
quiet, one line — is the whole onboarding fix.

---

## Priority summary

| Pri | Page | Recommendation |
|-----|------|----------------|
| **P0** | Homepage | Vertically centre the content cluster as one optical group |
| **P0** | Homepage | Bring the primary CTA into the cluster, directly under the card |
| **P0** | A/B Results | Show the confidence interval — draw the statistics, don't just state them |
| **P0** | A/B Results | Calm, always-positive verdict headline + one plain sentence |
| **P0** | RCA | Replace the 1200px table with a vertical review queue of cards |
| **P0** | RCA | Lead each card with the diagnosis, evidence below |
| **P1** | Onboarding | Replace the dead-end "Step 1" eyebrow with a 3-step journey rail |
| **P1** | Homepage | Consistent 4px spacing rhythm; tighten measure (~46ch / ~460px card) |
| **P1** | A/B Results | Separate "promote to control" from the verdict; make improvement stats symmetric |
| **P1** | A/B Results | One shared chart legend; mark the winning chart; full-width primary action |
| **P1** | RCA | Side-by-side reference vs AI answer; labelled score chips; stronger edit affordance |
| **P2** | Homepage | Lighten the single-dataset card chrome |
| **P2** | A/B Results | Order results by importance (verdict → evidence → detail) |
| **P2** | RCA | Sticky submit bar with live count; replace hard-coded `#800000` with tokens |

Everything above is refinement of an already-tasteful design system. Nothing
here adds a feature, a page, or a decoration — it makes what already exists
read clearly, calmly, and with intent. The redesign of all four points is
viewable in `prototype/index.html`.
