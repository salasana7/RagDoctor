import { T } from "./theme";

export const BACKEND_URL = "hanhanchatbot-production.up.railway.app";

export const embeddingModels = [
  { label: "text-embedding-3-small", value: "text-embedding-3-small" },
];
export const answerGenLLMModels = [
  { label: "llama-3.1-8b-instant", value: "llama-3.1-8b-instant" },
  { label: "openai/gpt-oss-120b", value: "openai/gpt-oss-120b" },
];

export const SCORE_COLORS = {
  "-1": T.color.scoreNeg1, // Outlier: AI better than ground truth
  "0":  T.color.score0,    // Worst: completely irrelevant
  "1":  T.color.score1,    // Low value
  "2":  T.color.score2,    // Partially relevant
  "3":  T.color.score3,    // Highly relevant
};

// Ink color for numerals printed inside a colored segment (static — dark
// segments always want light ink, light segments always want dark ink).
export const SCORE_INK = {
  "-1": T.color.onColorLight,
  "0":  T.color.onColorLight,
  "1":  T.color.onColorLight,
  "2":  T.color.onColorDark,
  "3":  T.color.onColorDark,
};

export const RETRIEVAL_SCORE_DEFS = [
  { score: "-1", label: "Retrieved content is more relevant than human labeled context" },
  { score: "0",  label: "Completely irrelevant retrieved content" },
  { score: "1",  label: "Relevant retrieved content but low value" },
  { score: "2",  label: "Partially relevant retrieved content" },
  { score: "3",  label: "Highly relevant retrieved content" },
];

export const ANSWER_SCORE_DEFS = [
  { score: "-1", label: "AI's answer is better than the 'ground truth'" },
  { score: "0",  label: "Completely irrelevant answer" },
  { score: "1",  label: "Relevant answer but low value" },
  { score: "2",  label: "Partially correct answer" },
  { score: "3",  label: "Highly accurate answer" },
];
