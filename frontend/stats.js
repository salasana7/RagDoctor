// ─── Statistical comparison helpers ─────────────────────────────────────────
export function getTCritical(df) {
  // Two-tailed 95% CI critical values (t-distribution)
  const table = [
    [1,12.706],[2,4.303],[3,3.182],[4,2.776],[5,2.571],
    [6,2.447],[7,2.365],[8,2.306],[9,2.262],[10,2.228],
    [11,2.201],[12,2.179],[13,2.160],[14,2.145],[15,2.131],
    [16,2.120],[17,2.110],[18,2.101],[19,2.093],[20,2.086],
    [25,2.060],[30,2.042],[40,2.021],[60,2.000],[120,1.980],
  ];
  if (df <= 0) return 12.706;
  if (df >= 120) return 1.960;
  for (let i = 0; i < table.length - 1; i++) {
    if (df >= table[i][0] && df <= table[i+1][0]) {
      const t = (df - table[i][0]) / (table[i+1][0] - table[i][0]);
      return table[i][1] + t * (table[i+1][1] - table[i][1]);
    }
  }
  return 1.960;
}

export function computeAQCI(records1, records2) {
  if (!records1?.length || !records2?.length) return null;
  const n = Math.min(records1.length, records2.length);
  const diffs = [];
  for (let i = 0; i < n; i++) {
    const s1 = Number(records1[i]?.new_answer_quality_score);
    const s2 = Number(records2[i]?.new_answer_quality_score);
    if (!isNaN(s1) && !isNaN(s2)) diffs.push(s2 - s1);
  }
  if (diffs.length < 2) return null;
  const nd = diffs.length;
  const meanD = diffs.reduce((a, b) => a + b, 0) / nd;
  const varD = diffs.reduce((s, d) => s + (d - meanD) ** 2, 0) / (nd - 1);
  const se = Math.sqrt(varD / nd);
  const margin = getTCritical(nd - 1) * se;
  const ciLower = meanD - margin;
  const ciUpper = meanD + margin;
  return { meanDiff: meanD, ciLower, ciUpper, rag2Better: ciLower > 0, n: nd };
}

export function parseSuggestions(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map(s => s.replace(/^[\s]*[\d]+[.)]\s*|^[\s]*[-•*]\s*/, '').trim())
    .filter(s => s.length > 0);
}
