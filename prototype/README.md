# RagDoctor — UX Redesign Prototype

A self-contained, static preview of a proposed redesign of the RagDoctor web
playground. No build step, no dependencies.

## How to view

**Open `prototype/index.html` in any browser** — double-click the file, or drag
it into a browser window. That's it.

`styles.css` loads as a relative file, so keep the two files together. An
internet connection is only used to fetch the Inter / IBM Plex Mono webfonts;
offline it falls back to system fonts and still looks correct.

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | The interactive prototype — all three screens + onboarding |
| `styles.css` | Stylesheet; palette and tokens mirror `frontend/globals.css` |
| `UX-REVIEW.md` | The written UX review with prioritized recommendations |
| `README.md` | This file |

## Using the prototype

A slim bar at the top is the **prototype's own chrome** (not part of the
product). Use it to:

- Switch screens — **Homepage**, **A/B Results**, **Root-Cause Analysis**.
- Toggle **light / dark** (also wired to the in-screen theme buttons).

## The three screens

1. **Homepage** — the content cluster is vertically centred and rhythmically
   spaced; the primary CTA sits directly under the dataset card; the dead-end
   "Step 1" eyebrow is replaced by a quiet **3-step journey rail** (the
   onboarding fix). Shown in the "dataset ready" state.
2. **A/B Results** — the comparison results state. A calm verdict headline, a
   **confidence-interval strip** that *draws* the statistic instead of just
   stating it, one shared chart legend with the winning chart marked, symmetric
   improvement stats, and a root-cause section with a real primary action.
3. **Root-Cause Analysis** — the 1200px-wide table is replaced by a **review
   queue of cards**: one flagged record each, diagnosis first, reference vs. AI
   answer side by side, labelled score chips, and a sticky submit bar.

Every screen works in both light and dark mode.

## Scope

This prototype is **additive only**. Nothing in `frontend/` or anywhere else in
the repository was modified. It is a preview for discussion — see `UX-REVIEW.md`
for the reasoning behind each change.
