# Investigation: real-time progress for the A/B comparison run

The A/B comparison run on Page 2 (`ABTestPage.js`) takes several minutes.
Today the user stares at a single spinner ("Running RAG pipelines…") with no
idea what the backend is doing. This document traces the current data flow,
weighs the three transport options for streaming genuine backend progress, and
records the chosen approach.

## Current data flow (the A/B run)

1. **Kick-off.** `ABTestPage.handleRunRAGs()` (or `handleNewABTest` →
   `_runRAGsDirectly`) sends `POST /run-rags` with `{ dataset, rag1, rag2 }`.
2. **Enqueue.** `run_rags()` in `backend/main.py` mints a `job_id`, snapshots
   the in-memory `rag_data`, appends to `_queue_order`, puts the job on the
   `asyncio.Queue` `_job_queue`, and **returns immediately** with
   `{ job_id, position }`. The HTTP request is now over.
3. **Detached execution.** A single long-lived worker, `process_job_queue()`
   (spawned once in `lifespan`), pulls jobs off the queue one at a time:
   - `run_all_in_processes(...)` — runs both RAG pipelines in a
     `ProcessPoolExecutor` (embedding + hybrid retrieval + answer generation
     for every dataset record).
   - `run_auto_eval(...)` — scores retrieval quality and answer quality for
     both configs with the eval LLM.
   - Writes the finished result into the shared dict `_job_results[job_id]`.
4. **Polling.** The frontend polls `GET /job-status/{job_id}` every 5 s. The
   endpoint just reads `_job_results[job_id]`. On `status: "done"` the poll
   stops and results render.
5. **RCA.** When the RAG run finishes, the page auto-fires `POST
   /run-rca/{job_id}`; `_run_rca_task` runs detached and writes
   `_rca_results[rca_job_id]`; the frontend polls `GET /rca-status/{rca_job_id}`
   every 5 s.

### The architectural fact that decides this

**The run is fully detached from any HTTP request.** The request that starts
it returns in milliseconds; the actual work happens later, inside a background
worker, and its *only* channel back to the world is a shared in-memory dict
(`_job_results` / `_rca_results`) that a polling endpoint reads.

Any progress mechanism therefore has two hops:

```
background worker  ──(hop 1)──►  shared state  ──(hop 2)──►  client
```

Hop 1 is unavoidable and identical for every option — the worker must write its
progress somewhere. The three options below differ *only* in hop 2.

## Options for hop 2

### Option A — Server-Sent Events (SSE)

A new endpoint (`GET /run-rags-stream/{job_id}`) returns a
`StreamingResponse` with `text/event-stream` and yields events as they happen.

- **Pros.** Real push; sub-second latency; native `EventSource` in the browser
  (RN-Web renders in a browser, so this is available); auto-reconnect built in.
- **Cons.** The detached worker still can't push into the streaming response —
  the SSE generator would itself have to *poll the shared dict* and forward
  deltas. So SSE does not remove hop-2 polling; it relocates it server-side and
  adds a long-lived connection on top. Long-lived streams on Railway's edge
  need heartbeat comments to survive idle proxy timeouts; multi-minute runs
  mean a multi-minute open connection per client. Proxy/CDN response buffering
  can also defeat streaming unless explicitly disabled.

### Option B — WebSocket

`@app.websocket("/ws/run/{job_id}")`, push frames to the client.

- **Pros.** Real push; bidirectional.
- **Cons.** The progress channel is strictly **server → client** — there is no
  bidirectional need, so the duplex socket is pure overhead. Same detached-job
  problem as SSE: the socket handler must still read the shared dict. Adds
  connection-lifecycle code (open/close/reconnect/heartbeat) on both ends for
  zero capability gain over SSE here. Best reserved for high-frequency,
  truly interactive streams (e.g. token-by-token output) — not coarse,
  multi-second stage events.

### Option C — Status-endpoint polling (extend what already exists)

Add a `stages` list to the job's existing result dict. The detached worker
appends a real stage event each time it genuinely starts/finishes a step.
`GET /job-status/{job_id}` already returns that dict — so `stages` ships for
free. The frontend already polls; it just renders `data.stages`.

- **Pros.** Zero new transport, zero new infra surface. Fits the existing
  detached-job + shared-dict + polling architecture exactly — it *is* hop 2,
  unchanged. Stateless and idempotent: survives tab refresh, network blips and
  reconnects with no special handling. No idle-timeout, no proxy-buffering, no
  heartbeat concerns on Railway. Already proven in this codebase (queue
  position is delivered this way today). Smallest, lowest-risk diff.
- **Cons.** Latency is bounded by the poll interval. Mitigated by dropping the
  interval from 5 s to 2 s while a run is active — a tiny JSON payload, and far
  faster than any individual backend stage (each stage runs for tens of
  seconds), so a human reading the log cannot tell it from a true stream.

## Recommendation — Option C, status-endpoint polling

For this stack (detached background jobs, single-process in-memory state,
FastAPI on Railway, RN-Web frontend), polling is the right call:

1. **It matches the architecture.** The job is already detached and already
   surfaced through a polling endpoint reading a shared dict. SSE and WebSocket
   do not eliminate that shared-state hop — they wrap a persistent connection
   around it, adding failure modes (idle timeouts, buffering, reconnect logic)
   without removing any work.
2. **The data is coarse and slow.** A handful of stage messages over a
   multi-minute run. Sub-second push latency buys nothing a human can perceive;
   2 s polling already reads as a live stream.
3. **It is the lowest-risk option on Railway** — ordinary short HTTP requests,
   no long-lived connections to keep alive through the edge proxy.
4. **It is feasible to ship end-to-end this session**, which SSE/WebSocket —
   with their connection lifecycle and infra tuning — are not, cleanly.

SSE would become the better choice only if progress turned high-frequency
(e.g. streaming generated tokens). It is not — so polling wins.

## Implemented in this change

Backend (`backend/main.py`, `backend/utils.py`):

- `_record_stage(store, key, message)` appends `{ t, message }` to a job's
  `stages` list in the shared dict. Stages are emitted **only at real
  execution boundaries** — never on a timer.
- `process_job_queue()` emits: run started, building RAG pipelines, each RAG
  pipeline ready (as its process-pool future resolves), scoring started, each
  RAG scored (as its eval coroutine resolves), aggregating verdict.
- `run_all_in_processes()` and `run_auto_eval()` take an optional
  `on_progress` callback and fire it as each pipeline / evaluation genuinely
  completes (via `asyncio.as_completed` / per-coroutine wrappers), so
  "RAG 1 ready" / "RAG 2 ready" reflect true completion order.
- `_run_rca_task()` emits: loading records, cache-check result, running RCA,
  which comparison path was taken, summarizing patterns.
- `GET /job-status` and `GET /rca-status` return `stages` unchanged — no new
  endpoint.

Frontend (`frontend/components/ActivityLog.js`, `frontend/pages/ABTestPage.js`):

- New `ActivityLog` component renders the stage list as a terminal-style log —
  completed stages get a check, the newest stage gets a small spinner.
- `ABTestPage` keeps `stages` / `rcaStages` state, fills them from each poll
  response, and renders `ActivityLog` beside the RAG-run and RCA spinners.
- The poll interval drops from 5 s to 2 s while a run is active.

Because every message originates from a real backend code path, the log can
never drift ahead of — or lie about — what the server is actually doing.
