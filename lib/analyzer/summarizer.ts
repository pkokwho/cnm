import { Summary } from "./types";
import { splitSentences, tokenize, wordFrequency, getTopKeywords } from "./tokenizers";

const KEYWORD_BONUS_WORDS = [
  "金额", "元", "合同", "签字", "同意", "责任", "违约", "期限",
  "日期", "时间", "付款", "退款", "赔偿", "证据", "报警", "投诉",
  "维权", "起诉", "调解", "协商", "到期", "逾期", "紧急", "重要",
  "租金", "押金", "维修", "退还", "通知", "承担", "负责",
];

// Check if a sentence is mostly symbols/punctuation (not meaningful content)
function isLowQualitySentence(s: string): boolean {
  // Remove all whitespace, digits, punctuation, underscores
  const content = s.replace(/[\s\d_=\-+#*•·、，。！？：；""''（）()\[\]【】《》<>…—\.\,!?;:'"/\\|`~@^&]/g, "");
  // If less than 30% of the original length is actual content, skip it
  if (s.length === 0) return true;
  return content.length / s.length < 0.3;
}

export function summarize(text: string, materialId?: string): Summary {
  if (!text || text.trim().length === 0) {
    return { oneLine: "（无可用文本）", keyPoints: [], keywords: [] };
  }

  let sentences = splitSentences(text);
  if (sentences.length === 0) {
    return { oneLine: text.substring(0, 100), keyPoints: [], keywords: [] };
  }

  // Filter out low-quality sentences
  sentences = sentences.filter(s => {
    if (s.length < 6) return false; // Too short
    if (isLowQualitySentence(s)) return false; // Mostly symbols
    // Skip lines that look like headers/dividers
    if (/^[=＿_\-]{3,}$/.test(s)) return false;
    return true;
  });

  if (sentences.length === 0) {
    return { oneLine: text.substring(0, 100).trim(), keyPoints: [], keywords: [] };
  }

  // Build word frequency map using proper Chinese tokenizer
  const freq = wordFrequency(text);

  // Score each sentence
  const scored = sentences.map((sentence, index) => {
    let score = 0;

    // TF score: use proper tokenization for Chinese text
    const tokens = tokenize(sentence);
    const tokenSet = new Set(tokens); // Deduplicate tokens within a sentence
    for (const token of tokenSet) {
      const tf = freq.get(token) || 0;
      score += tf;
    }

    // Normalize by sentence length to avoid favoring long sentences
    if (tokens.length > 0) {
      score = score / Math.sqrt(tokens.length);
    }

    // Position weight: first 3 sentences get bonus
    if (index < 3) score *= 1.4;

    // Keyword bonus: sentences containing important words get boosted
    let bonusCount = 0;
    for (const bonusWord of KEYWORD_BONUS_WORDS) {
      if (sentence.includes(bonusWord)) {
        bonusCount++;
      }
    }
    if (bonusCount > 0) {
      score *= (1 + 0.2 * bonusCount);
    }

    // Length normalization: prefer medium-length sentences (15-100 chars)
    if (sentence.length < 10) score *= 0.3;
    else if (sentence.length > 120) score *= 0.7;

    // Penalty for sentences with repeated characters (like signatures)
    const underscoreRatio = (sentence.match(/[_＿]/g) || []).length / sentence.length;
    if (underscoreRatio > 0.1) score *= 0.1;

    return { sentence, score, index };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // One-line summary: highest scored sentence (truncated)
  const oneLine = scored[0].sentence.substring(0, 100);

  // Key points: top 3-5 sentences (deduplicated, truncated)
  const seen = new Set<string>();
  const keyPoints: string[] = [];
  for (const item of scored) {
    const truncated = item.sentence.substring(0, 100);
    const dedupKey = truncated.substring(0, 20);
    if (!seen.has(dedupKey) && truncated.length > 6) {
      seen.add(dedupKey);
      keyPoints.push(truncated);
      if (keyPoints.length >= 5) break;
    }
  }

  // Keywords: top 10 by frequency (getTopKeywords already filters symbols)
  const keywords = getTopKeywords(text, 10);

  return { oneLine, keyPoints, keywords };
}
