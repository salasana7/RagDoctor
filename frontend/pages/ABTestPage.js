import { useState, useEffect, useRef, useMemo } from "react";
import { T } from "../theme";
import { BACKEND_URL, embeddingModels, answerGenLLMModels, RETRIEVAL_SCORE_DEFS, ANSWER_SCORE_DEFS } from "../constants";
import { computeAQCI, parseSuggestions } from "../stats";
import { Nav } from "../components/Nav";
import { RAGSettings } from "../components/RAGSettings";
import { EvalStackedBarChart } from "../components/EvalStackedBarChart";
import { SuggestionItem } from "../components/common";

// ─── Page 2: RAG A/B Test ─────────────────────────────────────────────────────

export function ABTestPage({ selectedDataset }) {
  const [rag1Model, setRag1Model] = useState(embeddingModels[0].value);
  const [rag2Model, setRag2Model] = useState(embeddingModels[0].value);
  const [rag1TopN, setRag1TopN] = useState(1);
  const [rag2TopN, setRag2TopN] = useState(1);
  const [rag1SemanticWeight, setRag1SemanticWeight] = useState(0.5);
  const [rag2SemanticWeight, setRag2SemanticWeight] = useState(0.5);
  const [rag1AGLLM, setRag1AGLLM] = useState(answerGenLLMModels[0].value);
  const [rag2AGLLM, setRag2AGLLM] = useState(answerGenLLMModels[0].value);
  const [ragStatus, setRagStatus] = useState("idle");
  const [evalResults, setEvalResults] = useState({ rag1: null, rag2: null });
  const [jobId, setJobId] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const pollRef = useRef(null);
  const [rcaStatus, setRcaStatus] = useState("idle");
  const [rcaJobId, setRcaJobId] = useState(null);
  const rcaPollRef = useRef(null);
  const [settingsChangedAfterRCA, setSettingsChangedAfterRCA] = useState(false);
  const [rcaData, setRcaData] = useState(null);
  const [settingsChangedAfterRAG, setSettingsChangedAfterRAG] = useState(false);
  const [checkedSuggestionsCount, setCheckedSuggestionsCount] = useState(0);
  // pendingSwap: set by RCA tab Submit; consumed when user clicks "Run New A/B Test"
  const [pendingSwap, setPendingSwap] = useState(null); // { controlGroup } | null
  const [hasRunNewABTest, setHasRunNewABTest] = useState(false);

  // true whenever "Run New A/B Test" button is visible — suppresses Compare button
  const newABTestReadyRef = useRef(false);
  const newABTestReady = checkedSuggestionsCount > 0 || !!pendingSwap;
  newABTestReadyRef.current = newABTestReady;

  const ciResult = useMemo(() => {
    if (!evalResults.rag1?.eval_records || !evalResults.rag2?.eval_records) return null;
    return computeAQCI(evalResults.rag1.eval_records, evalResults.rag2.eval_records);
  }, [evalResults]);

  // Winning settings column — celebrated once results land.
  const winningSide = (ragStatus === "done" && ciResult && !settingsChangedAfterRAG)
    ? (ciResult.rag2Better ? "rag2" : "rag1")
    : null;

  const improvementStats = useMemo(() => {
    if (!evalResults.rag1 || !evalResults.rag2) return null;
    const toPct = (counts) => {
      if (!counts) return {};
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      if (!total) return {};
      const pcts = {};
      for (const k in counts) pcts[k] = counts[k] / total * 100;
      return pcts;
    };
    const rq1 = toPct(evalResults.rag1.retrieval_quality_counts);
    const rq2 = toPct(evalResults.rag2.retrieval_quality_counts);
    const aq1 = toPct(evalResults.rag1.answer_quality_counts);
    const aq2 = toPct(evalResults.rag2.answer_quality_counts);
    return {
      retrievalFailureRecovery: (rq1["0"] || 0) - (rq2["0"] || 0),
      retrievalRelevancyImprovement: ((rq2["2"] || 0) + (rq2["3"] || 0)) - ((rq1["2"] || 0) + (rq1["3"] || 0)),
      hallucinationReduction: (aq1["0"] || 0) - (aq2["0"] || 0),
      answerQualityImprovement: ((aq2["2"] || 0) + (aq2["3"] || 0)) - ((aq1["2"] || 0) + (aq1["3"] || 0)),
    };
  }, [evalResults]);

  // Plain-language verdict derived from the answer-quality CI.
  const verdict = useMemo(() => {
    if (!ciResult) return null;
    const { meanDiff, ciLower, ciUpper, n } = ciResult;
    const decisive = ciLower > 0 || ciUpper < 0;
    return {
      decisive,
      headline: ciLower > 0 ? "RAG 2 wins" : ciUpper < 0 ? "RAG 1 wins" : "No significant difference",
      mag: Math.abs(meanDiff).toFixed(2),
      n,
    };
  }, [ciResult]);

  const ciResultRef = useRef(null);
  ciResultRef.current = ciResult;

  const evalResultsRef = useRef(evalResults);
  evalResultsRef.current = evalResults;

  // Keep a live ref of rag2 values to avoid stale closures in the eager-update effect
  const rag2ValuesRef = useRef({ rag2Model, rag2TopN, rag2SemanticWeight, rag2AGLLM });
  rag2ValuesRef.current = { rag2Model, rag2TopN, rag2SemanticWeight, rag2AGLLM };

  // ── Eagerly update left pane when "Run New A/B Test" button first appears ──────
  useEffect(() => {
    if (!newABTestReady) return;
    const controlGroup = pendingSwap?.controlGroup ?? (ciResultRef.current?.rag2Better ? 'rag2' : 'rag1');
    if (controlGroup === 'rag2') {
      const { rag2Model: m, rag2TopN: t, rag2SemanticWeight: s, rag2AGLLM: l } = rag2ValuesRef.current;
      setRag1Model(m); setRag1TopN(t); setRag1SemanticWeight(s); setRag1AGLLM(l);
    }
    // if controlGroup === 'rag1', left pane already has the correct settings
  }, [checkedSuggestionsCount, pendingSwap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for rcaSubmitted written by the RCA tab on Submit ─────────────────────
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== 'rcaSubmitted') return;
      const raw = e.newValue;
      if (!raw) return;
      const { controlGroup } = JSON.parse(raw);
      localStorage.removeItem('rcaSubmitted');
      setPendingSwap({ controlGroup });
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Fire run directly with explicit values (bypasses stale state) ────────────
  const _runRAGsDirectly = async (rag1Cfg, rag2Cfg) => {
    try {
      const toConfig = ({ model, topN, semW, agLLM }) => ({
        embedding_model: model, top_n: topN,
        semantic_weight: semW, keyword_weight: parseFloat((1 - semW).toFixed(2)),
        answer_gen_llm: agLLM,
      });
      const body = { dataset: selectedDataset, rag1: toConfig(rag1Cfg), rag2: toConfig(rag2Cfg) };
      const response = await fetch(`https://${BACKEND_URL}/run-rags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setJobId(data.job_id);
      setQueuePosition(data.position);
      setRagStatus(data.position === 0 ? "running" : "queued");
    } catch (error) {
      console.error("Error running RAGs:", error);
      setRagStatus("error");
    }
  };

  // ── Apply pane swap + edits + immediately run — called by "Run New A/B Test" ──
  const handleNewABTest = () => {
    // Left pane already updated eagerly when newABTestReady became true; read current rag1 state directly
    const newCtrlModel = rag1Model;
    const newCtrlTopN  = rag1TopN;
    const newCtrlSemW  = rag1SemanticWeight;
    const newCtrlAGLLM = rag1AGLLM;

    setHasRunNewABTest(true);
    setPendingSwap(null);
    setEvalResults({ rag1: null, rag2: null });
    setJobId(null);
    setRcaStatus('idle');
    setRcaData(null);
    setSettingsChangedAfterRAG(false);
    setSettingsChangedAfterRCA(false);
    setRagStatus('running'); // show spinner immediately — no Compare button flash

    // Pass computed values directly since React state hasn't settled yet
    _runRAGsDirectly(
      { model: newCtrlModel, topN: newCtrlTopN, semW: newCtrlSemW, agLLM: newCtrlAGLLM },
      { model: rag2Model, topN: rag2TopN, semW: rag2SemanticWeight, agLLM: rag2AGLLM }
    );
  };

  useEffect(() => {
    if (!rcaJobId) return;
    rcaPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`https://${BACKEND_URL}/rca-status/${rcaJobId}`);
        const data = await res.json();
        if (data.status === "done") {
          const controlGroup = ciResultRef.current?.rag2Better === false ? "rag1" : "rag2";
          const results = {
            rag1: data.rca_records_1,
            rag2: data.rca_records_2,
            agg_review_1: data.agg_review_1,
            agg_review_2: data.agg_review_2,
            controlGroup,
          };
          localStorage.setItem('rcaResults', JSON.stringify(results));
          const controlItems = results[controlGroup];
          const controlAggReview = controlGroup === "rag1" ? results.agg_review_1 : results.agg_review_2;
          const hasReEvalRows = controlItems.some(item => item?.needs_re_eval === 1);
          const rag2Better = ciResultRef.current?.rag2Better === true;
          const controlSuggestions = parseSuggestions(controlAggReview?.improvement_suggestions);
          const compareLessons = rag2Better ? (data.compare_patterns || []) : (data.rca_summary_patterns || []);
          const er = evalResultsRef.current;
          const rcaCiResult = computeAQCI(er?.rag1?.eval_records, er?.rag2?.eval_records);
          setRcaData({ hasReEvalRows, controlSuggestions, compareLessons, rag2Better: rcaCiResult?.rag2Better === true });
          setRcaStatus("done");
          clearInterval(rcaPollRef.current);
        } else if (data.status === "error") {
          setRcaStatus("error");
          clearInterval(rcaPollRef.current);
        }
      } catch {
        clearInterval(rcaPollRef.current);
      }
    }, 5000);
    return () => clearInterval(rcaPollRef.current);
  }, [rcaJobId]);

  useEffect(() => {
    if (newABTestReadyRef.current) return;
    if (rcaStatus === "done") { setRcaStatus("idle"); setRcaData(null); }
  }, [rag1Model, rag1TopN, rag1SemanticWeight, rag1AGLLM,
      rag2Model, rag2TopN, rag2SemanticWeight, rag2AGLLM]);

  useEffect(() => {
    if (newABTestReadyRef.current) return;
    if (rcaStatus === "done") setSettingsChangedAfterRCA(true);
  }, [rag1Model, rag1TopN, rag1SemanticWeight, rag1AGLLM,
      rag2Model, rag2TopN, rag2SemanticWeight, rag2AGLLM]);

  useEffect(() => {
    if (ragStatus === "done") setSettingsChangedAfterRCA(false);
  }, [ragStatus]);

  // Auto-trigger RCA as soon as RAG results are ready
  useEffect(() => {
    if (ragStatus === "done" && rcaStatus === "idle" && jobId) {
      handleRunRCA();
    }
  }, [ragStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCheckedSuggestionsCount(0);
  }, [rcaData]);

  useEffect(() => {
    if (newABTestReadyRef.current) return;
    if (ragStatus === "done") setSettingsChangedAfterRAG(true);
  }, [rag1Model, rag1TopN, rag1SemanticWeight, rag1AGLLM,
      rag2Model, rag2TopN, rag2SemanticWeight, rag2AGLLM]);

  const handleRunRCA = async () => {
    setSettingsChangedAfterRCA(false);
    setRcaStatus("running");
    localStorage.removeItem('rcaResults');
    try {
      const res = await fetch(`https://${BACKEND_URL}/run-rca/${jobId}`, { method: "POST" });
      const data = await res.json();
      setRcaJobId(data.rca_job_id);
    } catch {
      setRcaStatus("error");
    }
  };

  useEffect(() => {
    if (!jobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`https://${BACKEND_URL}/job-status/${jobId}`);
        const data = await res.json();
        if (data.status === "queued") {
          setRagStatus("queued");
          setQueuePosition(data.position);
        } else if (data.status === "running") {
          setRagStatus("running");
          setQueuePosition(null);
        } else if (data.status === "done") {
          setEvalResults({ rag1: data.rag1, rag2: data.rag2 });
          setRagStatus("done");
          clearInterval(pollRef.current);
        } else if (data.status === "error") {
          setRagStatus("error");
          clearInterval(pollRef.current);
        }
      } catch {
        clearInterval(pollRef.current);
      }
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [jobId]);

  const handleRunRAGs = async () => {
    try {
      const body = {
        dataset: selectedDataset,
        rag1: {
          embedding_model: rag1Model,
          top_n: rag1TopN,
          semantic_weight: rag1SemanticWeight,
          keyword_weight: parseFloat((1 - rag1SemanticWeight).toFixed(2)),
          answer_gen_llm: rag1AGLLM,
        },
        rag2: {
          embedding_model: rag2Model,
          top_n: rag2TopN,
          semantic_weight: rag2SemanticWeight,
          keyword_weight: parseFloat((1 - rag2SemanticWeight).toFixed(2)),
          answer_gen_llm: rag2AGLLM,
        },
      };
      const response = await fetch(`https://${BACKEND_URL}/run-rags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setJobId(data.job_id);
      setQueuePosition(data.position);
      setRagStatus(data.position === 0 ? "running" : "queued");
      setSettingsChangedAfterRAG(false);
    } catch (error) {
      console.error("Error running RAGs:", error);
      setRagStatus("error");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100vh",
      background: T.color.bg,
      fontFamily: T.font.sans,
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      {/* ── Top Header Bar — shared nav + the dataset-status pill ── */}
      <Nav extras={
        <>
          {/* Dataset status */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: T.font.mono,
            fontSize: "0.78rem",
            color: T.color.textMuted,
            letterSpacing: "0.01em",
          }}>
            <span style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: T.color.sage,
              boxShadow: `0 0 0 3px ${T.color.sageSoft}`,
            }} aria-hidden />
            {selectedDataset}
          </div>

          <div style={{ width: "1px", height: "22px", background: T.color.border }} aria-hidden />
        </>
      } />

      {/* ── Body: 3-column layout ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: RAG 1 Settings */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>
          <RAGSettings
            title="Control Group: RAG 1 Settings"
            selectedModel={rag1Model}
            onModelChange={setRag1Model}
            topN={rag1TopN}
            onTopNChange={setRag1TopN}
            semanticWeight={rag1SemanticWeight}
            onSemanticWeightChange={setRag1SemanticWeight}
            agLLM={rag1AGLLM}
            onAGLLMChange={setRag1AGLLM}
            highlightGreen={newABTestReady}
            winner={newABTestReady ? !!winningSide : winningSide === "rag1"}
          />
        </div>

        {/* Center: Compare button + results */}
        <div style={{
          flex: 2.2,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 24px",
          boxSizing: "border-box",
        }}>
          {ragStatus === "queued" ? (
            <div style={{
              marginTop: "32px",
              padding: "14px 22px",
              borderRadius: T.radius.md,
              background: T.color.warningSoft,
              border: `1px solid ${T.color.saffron}`,
              color: T.color.warning,
              fontSize: "0.95rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <div style={{
                width: "14px", height: "14px",
                border: `2px solid ${T.color.saffronSoft}`,
                borderTopColor: T.color.warning,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              {queuePosition - 1 === 0
                ? "You're next. Waiting for the current run to finish."
                : `${queuePosition - 1} user${queuePosition - 1 === 1 ? "" : "s"} waiting ahead of you`}
            </div>
          ) : ragStatus === "running" ? (
            <div style={{ marginTop: "40px", textAlign: "center" }}>
              <div style={{
                width: "48px", height: "48px",
                margin: "0 auto 18px",
                border: `2px solid ${T.color.border}`,
                borderTopColor: T.color.coral,
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }} />
              <div style={{ fontSize: "1.15rem", fontWeight: 600, color: T.color.brandText, letterSpacing: "-0.005em" }}>
                Running RAG pipelines
                <span style={{ display: "inline-block", animation: "dotFade 1.5s ease-in-out infinite 0s" }}>.</span>
                <span style={{ display: "inline-block", animation: "dotFade 1.5s ease-in-out infinite 0.3s" }}>.</span>
                <span style={{ display: "inline-block", animation: "dotFade 1.5s ease-in-out infinite 0.6s" }}>.</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: "0.88rem", color: T.color.textMuted }}>
                Comparing retrieval and answer quality across both configurations.
              </div>
            </div>
          ) : (
            <>
              {((!hasRunNewABTest && ragStatus !== "done") || settingsChangedAfterRAG) && (
                <button
                  onClick={handleRunRAGs}
                  className="enter-up"
                  style={{
                    width: "100%",
                    maxWidth: "520px",
                    background: "linear-gradient(135deg, var(--hero-cta-from), var(--hero-cta-to))",
                    color: "var(--hero-cta-text)",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px 24px",
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: "8px",
                    letterSpacing: "0.01em",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 0 12px rgba(255, 255, 255, 0.42), 0 14px 32px var(--hero-cta-glow)",
                  }}
                >
                  <span className="cta-fill" />
                  {ragStatus === "done" && settingsChangedAfterRAG ? (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span>Compare the new performance</span>
                      <span className="nudge-on-hover" style={{ display: "inline-block", fontSize: "1.05rem" }} aria-hidden>→</span>
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span>Configure both sides, then run comparison</span>
                      <span className="nudge-on-hover" style={{ display: "inline-block", fontSize: "1.05rem" }} aria-hidden>→</span>
                    </span>
                  )}
                </button>
              )}

              {ragStatus === "done" && (
                <>
                  {newABTestReady && (
                    <div className="enter-up" style={{ width: "100%" }}>
                      <div style={{
                        width: "100%",
                        padding: "16px 20px",
                        background: T.color.sageSoft,
                        border: `1px solid ${T.color.sage}`,
                        borderRadius: T.radius.md,
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        boxSizing: "border-box",
                      }}>
                        <div aria-hidden style={{
                          flexShrink: 0, width: "34px", height: "34px", borderRadius: "50%",
                          background: T.color.sage, color: T.color.onColorLight,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.05rem", fontWeight: 700,
                        }}>★</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: T.color.text, letterSpacing: "-0.01em" }}>
                            {ciResult?.rag2Better ? "RAG 2" : "RAG 1"} is the new baseline
                          </div>
                          <div style={{ marginTop: "2px", fontSize: "0.88rem", color: T.color.textMuted, lineHeight: 1.5 }}>
                            Its winning settings are now loaded into Control · A. Adjust RAG 2 on the right, then run a new comparison to try to beat it.
                          </div>
                        </div>
                      </div>
                      {pendingSwap && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          marginTop: "12px",
                          fontSize: "0.84rem", color: T.color.success, fontWeight: 600,
                        }}>
                          <span aria-hidden>✓</span> Reference updates submitted
                        </div>
                      )}
                      <button
                        onClick={handleNewABTest}
                        style={{
                          width: "100%",
                          marginTop: pendingSwap ? "10px" : "12px",
                          background: "linear-gradient(135deg, var(--hero-cta-from), var(--hero-cta-to))",
                          color: "var(--hero-cta-text)",
                          border: "none",
                          borderRadius: "14px",
                          padding: "13px 22px",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 0 12px rgba(255, 255, 255, 0.42), 0 14px 32px var(--hero-cta-glow)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <span className="cta-fill" />
                        <span>Run new A/B test</span>
                        <span className="nudge-on-hover" style={{ display: "inline-block", fontSize: "1rem" }} aria-hidden>→</span>
                      </button>
                    </div>
                  )}
                  <div style={{
                    marginTop: "40px",
                    width: "100%",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: T.color.textSubtle,
                  }}>
                    RAG Performance Comparison
                  </div>

                  {/* Verdict — hidden once we've moved on to setting up a retry */}
                  {verdict && !settingsChangedAfterRAG && !newABTestReady && (
                    <div className="enter-up" style={{
                      marginTop: "14px",
                      width: "100%",
                      padding: "18px 20px",
                      background: verdict.decisive ? T.color.sageSoft : T.color.surfaceMuted,
                      border: `1px solid ${verdict.decisive ? T.color.sage : T.color.border}`,
                      borderRadius: T.radius.md,
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      boxSizing: "border-box",
                      animationDelay: "0ms",
                    }}>
                      <div aria-hidden style={{
                        flexShrink: 0,
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: verdict.decisive ? T.color.sage : T.color.surfaceSunk,
                        color: verdict.decisive ? T.color.onColorLight : T.color.textMuted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.15rem",
                        fontWeight: 700,
                      }}>
                        {verdict.decisive ? "✓" : "≈"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "1.18rem", fontWeight: 800, color: T.color.text, letterSpacing: "-0.015em" }}>
                          {verdict.headline}
                        </div>
                        <div style={{ marginTop: "3px", fontSize: "0.92rem", color: T.color.textMuted, lineHeight: 1.5 }}>
                          {verdict.decisive ? (
                            <>
                              <b style={{ color: T.color.success, fontSize: "1rem", fontWeight: 800 }}>+{verdict.mag}</b>
                              {" "}higher answer quality, measured across {verdict.n} questions.
                            </>
                          ) : (
                            <>RAG 1 and RAG 2 scored within {verdict.mag} of each other across {verdict.n} questions.</>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "16px",
                    marginTop: "16px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}>
                    <div className="enter-up" style={{ minWidth: 0, animationDelay: "80ms", display: "flex" }}>
                      <EvalStackedBarChart
                        title="Retrieval Quality Score"
                        rag1Counts={evalResults.rag1?.retrieval_quality_counts}
                        rag2Counts={evalResults.rag2?.retrieval_quality_counts}
                        scoreDefinitions={RETRIEVAL_SCORE_DEFS}
                      />
                    </div>
                    <div className="enter-up" style={{ minWidth: 0, animationDelay: "160ms", display: "flex" }}>
                      <EvalStackedBarChart
                        title="Answer Quality Score"
                        rag1Counts={evalResults.rag1?.answer_quality_counts}
                        rag2Counts={evalResults.rag2?.answer_quality_counts}
                        scoreDefinitions={ANSWER_SCORE_DEFS}
                      />
                    </div>
                  </div>
                  {ciResult && !settingsChangedAfterRAG && improvementStats && (
                        <div className="enter-up" style={{
                          marginTop: "16px",
                          width: "100%",
                          background: T.color.surface,
                          border: `1px solid ${T.color.border}`,
                          borderRadius: T.radius.lg,
                          padding: "22px 24px",
                          boxShadow: T.shadow.sm,
                          animationDelay: "240ms",
                        }}>
                          <h3 style={{
                            color: T.color.text,
                            margin: "0 0 18px 0",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            letterSpacing: "-0.005em",
                          }}>
                            Quality deltas · RAG 2 vs RAG 1
                          </h3>
                          <div style={{ display: "flex", gap: "32px" }}>
                            {[
                              {
                                heading: "Retrieval Quality",
                                rows: [
                                  { label: "Retrieval failure recovery", value: improvementStats.retrievalFailureRecovery },
                                  { label: "Retrieval relevancy improvement", value: improvementStats.retrievalRelevancyImprovement },
                                ],
                              },
                              {
                                heading: "Answer Quality",
                                rows: [
                                  { label: "Hallucination reduction", value: improvementStats.hallucinationReduction },
                                  { label: "Answer quality improvement", value: improvementStats.answerQualityImprovement },
                                ],
                              },
                            ].map(({ heading, rows }, idx) => (
                              <div key={heading} style={{
                                flex: 1,
                                minWidth: 0,
                                paddingLeft: idx === 0 ? 0 : "24px",
                                borderLeft: idx === 0 ? "none" : `1px solid ${T.color.border}`,
                              }}>
                                <div style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: T.color.textSubtle,
                                  marginBottom: "12px",
                                }}>
                                  {heading}
                                </div>
                                {rows.map(({ label, value }) => {
                                  const v = Math.round((Number(value) || 0) * 10) / 10;
                                  const color = v === 0 ? T.color.textMuted : v > 0 ? T.color.success : T.color.danger;
                                  return (
                                    <div key={label} style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "10px",
                                      fontSize: "0.88rem",
                                    }}>
                                      <span style={{ color: T.color.textMuted }}>{label}</span>
                                      <span style={{
                                        fontWeight: 700,
                                        marginLeft: "12px",
                                        color,
                                        fontVariantNumeric: "tabular-nums",
                                      }}>
                                        {v >= 0 ? "+" : ""}{v.toFixed(1)}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                  )}
                  {!settingsChangedAfterRCA && !settingsChangedAfterRAG && rcaStatus === "running" && (
                    <div style={{ marginTop: "40px", textAlign: "center" }}>
                      <div style={{
                        width: "40px", height: "40px",
                        margin: "0 auto 14px",
                        border: `3px solid ${T.color.border}`,
                        borderTopColor: T.color.coral,
                        borderRadius: "50%",
                        animation: "spin 0.9s linear infinite",
                      }} />
                      <div style={{ fontSize: "1.05rem", fontWeight: 600, color: T.color.brandText }}>
                        Running root cause analysis
                        <span style={{ display: "inline-block", animation: "dotFade 1.5s ease-in-out infinite 0s" }}>.</span>
                        <span style={{ display: "inline-block", animation: "dotFade 1.5s ease-in-out infinite 0.3s" }}>.</span>
                        <span style={{ display: "inline-block", animation: "dotFade 1.5s ease-in-out infinite 0.6s" }}>.</span>
                      </div>
                    </div>
                  )}
                  {!settingsChangedAfterRCA && !settingsChangedAfterRAG && rcaStatus === "done" && rcaData && (
                    <div className="enter-up" style={{
                      marginTop: "24px",
                      width: "100%",
                      background: T.color.surface,
                      border: `1px solid ${T.color.border}`,
                      borderRadius: T.radius.lg,
                      padding: "22px 24px",
                      boxShadow: T.shadow.sm,
                    }}>
                      <h3 style={{
                        color: T.color.text,
                        margin: "0 0 18px 0",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        letterSpacing: "-0.005em",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        <span aria-hidden style={{ color: T.color.brandText }}>☑</span>
                        Root cause analysis
                      </h3>
                      <div>
                          {/* Needs Review section */}
                          {(rcaData.hasReEvalRows || rcaData.controlSuggestions?.length > 0) && (
                            <div style={{ marginBottom: rcaData.compareLessons?.length > 0 ? "22px" : 0 }}>
                              <div style={{
                                fontWeight: 700,
                                color: T.color.textSubtle,
                                fontSize: "0.7rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "12px",
                              }}>
                                Needs Review
                              </div>
                              {rcaData.hasReEvalRows && (
                                <label style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                  marginBottom: "12px",
                                  padding: "10px 12px",
                                  borderRadius: T.radius.sm,
                                  background: T.color.coralSoft,
                                  border: `1px solid ${T.color.coral}`,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  color: T.color.danger,
                                  fontSize: "0.9rem",
                                }}>
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      setCheckedSuggestionsCount(prev => prev + (e.target.checked ? 1 : -1));
                                      if (e.target.checked) {
                                        window.open(`${window.location.pathname}?view=rca&dataset=${encodeURIComponent(selectedDataset)}`, '_blank');
                                      }
                                    }}
                                    style={{ marginTop: "2px", accentColor: T.color.brand, width: "16px", height: "16px", flexShrink: 0 }}
                                  />
                                  <span>Re-evaluate flagged records</span>
                                </label>
                              )}
                              {rcaData.controlSuggestions.map((suggestion, i) => (
                                <div key={i} className="enter-up" style={{ animationDelay: `${60 + i * 40}ms` }}>
                                  <SuggestionItem
                                    text={suggestion}
                                    onCheckedChange={(isChecked) => setCheckedSuggestionsCount(prev => prev + (isChecked ? 1 : -1))}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Lessons Learned section */}
                          {rcaData.compareLessons?.length > 0 && (
                            <div>
                              <div style={{
                                fontWeight: 700,
                                color: T.color.textSubtle,
                                fontSize: "0.7rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "12px",
                              }}>
                                Lessons Learned
                              </div>
                              <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.65, color: T.color.text }}>
                                {rcaData.compareLessons.map((lesson, i) => (
                                  <li key={i} style={{ marginBottom: "6px", fontSize: "0.9rem" }}>{lesson}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Right: RAG 2 Settings */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>
          <RAGSettings
            title="Test Group: RAG 2 Settings"
            selectedModel={rag2Model}
            onModelChange={setRag2Model}
            topN={rag2TopN}
            onTopNChange={setRag2TopN}
            semanticWeight={rag2SemanticWeight}
            onSemanticWeightChange={setRag2SemanticWeight}
            agLLM={rag2AGLLM}
            onAGLLMChange={setRag2AGLLM}
            fingerHint={newABTestReady}
            winner={!newABTestReady && winningSide === "rag2"}
          />
        </div>
      </div>
    </div>
  );
}
