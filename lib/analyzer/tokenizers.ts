const STOP_WORDS = new Set([
  "的", "了", "是", "在", "有", "和", "就", "不", "人", "都", "一", "一个",
  "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没", "看",
  "好", "自己", "这", "那", "他", "她", "它", "们", "个", "之", "与", "为",
  "以", "及", "或", "但", "而", "却", "如果", "虽然", "但是", "因为", "所以",
  "然", "后", "然后", "什么", "怎么", "为什么", "这个", "那个", "这些", "那些",
  "可以", "能够", "应该", "需要", "必须", "可能", "也许", "已经", "正在",
  "将", "被", "把", "让", "使", "给", "对", "向", "从", "由", "关于", "对于",
  "按照", "根据", "通过", "随着", "沿着", "由于", "鉴于", "基于",
  "并且", "而且", "此外", "另外", "同时", "随后", "接着", "于是", "因此",
  "不过", "只是", "只有", "除非", "除了", "无论", "不管", "即使", "尽管",
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
  "第", "此", "其", "某", "每", "各", "另", "本", "该",
]);

export function splitSentences(text: string): string[] {
  if (!text || text.trim().length === 0) return [];
  // Protect decimal numbers (0.5, 3.14, etc.) from being split
  const protected_text = text.replace(/(\d)\.(\d)/g, "$1<DOT>$2");
  // Split by Chinese and English sentence-ending punctuation
  const parts = protected_text.split(/[。！？\n；;！？.!?]+/);
  return parts
    .map((s) => s.replace(/<DOT>/g, ".").trim())
    .filter((s) => s.length > 0);
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const tokens: string[] = [];
  // Split on everything EXCEPT Chinese characters and ASCII letters
  // This preserves Chinese text segments for bigram generation
  const segments = text.split(/[^\u4e00-\u9fa5a-zA-Z]+/).filter((s) => s.length > 0);

  for (const seg of segments) {
    // For Chinese text, generate 2-char n-grams
    if (/[\u4e00-\u9fa5]/.test(seg)) {
      for (let i = 0; i < seg.length - 1; i++) {
        const bigram = seg.substring(i, i + 2);
        if (!STOP_WORDS.has(bigram)) {
          tokens.push(bigram);
        }
      }
      // Also add single chars that are not stop words
      for (const ch of seg) {
        if (!STOP_WORDS.has(ch) && /[\u4e00-\u9fa5]/.test(ch)) {
          tokens.push(ch);
        }
      }
    } else if (seg.length >= 2) {
      tokens.push(seg.toLowerCase());
    }
  }
  return tokens;
}

export function wordFrequency(text: string): Map<string, number> {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

export function getTopKeywords(text: string, n: number = 10): string[] {
  const freq = wordFrequency(text);
  // Filter: Chinese tokens must be 2+ chars, English 3+ chars
  const filtered = Array.from(freq.entries())
    .filter(([word]) => {
      // Must contain at least one Chinese or alphanumeric character
      if (!/[\u4e00-\u9fa5a-zA-Z]/.test(word)) return false;
      if (/[\u4e00-\u9fa5]/.test(word)) return word.length >= 2;
      return word.length >= 3;
    })
    .sort((a, b) => b[1] - a[1]);
  return filtered.slice(0, n).map(([word]) => word);
}
