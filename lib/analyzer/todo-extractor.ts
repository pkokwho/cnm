import { TodoItem } from "./types";
import { splitSentences } from "./tokenizers";
import { extractDates } from "./date-extractor";

const DIRECTIVE_WORDS: { word: string; priority: "high" | "medium" | "low" }[] = [
  // Strong → high
  { word: "必须", priority: "high" },
  { word: "务必", priority: "high" },
  { word: "一定", priority: "high" },
  { word: "马上", priority: "high" },
  { word: "立即", priority: "high" },
  { word: "紧急", priority: "high" },
  { word: "逾期", priority: "high" },
  { word: "务必于", priority: "high" },
  // Medium
  { word: "需要", priority: "medium" },
  { word: "应该", priority: "medium" },
  { word: "请于", priority: "medium" },
  { word: "要求", priority: "medium" },
  { word: "记得", priority: "medium" },
  { word: "别忘了", priority: "medium" },
  { word: "尽快", priority: "medium" },
  { word: "需", priority: "medium" },
  // Weak → low
  { word: "建议", priority: "low" },
  { word: "最好", priority: "low" },
  { word: "尽量", priority: "low" },
  { word: "不妨", priority: "low" },
];

// Check if a sentence starts with a chat speaker label (e.g., "张先生：", "我：")
function isChatMessage(s: string): boolean {
  return /^[^\s：:]{1,10}[：:]/.test(s.trim());
}

// Check if a sentence looks like a structural item (bullet point, numbered list)
function isStructuredItem(s: string): boolean {
  return /^[\d①②③④⑤⑥⑦⑧⑨⑩]+\s*[.、）)]\s*/.test(s.trim()) ||
         s.trim().startsWith("- ") ||
         s.trim().startsWith("• ") ||
         s.trim().startsWith("待办") ||
         s.trim().startsWith("注意");
}

function bumpPriority(priority: "high" | "medium" | "low"): "high" | "medium" | "low" {
  if (priority === "low") return "medium";
  if (priority === "medium") return "high";
  return "high";
}

export function extractTodos(
  text: string,
  materialId: string,
  materialName: string = ""
): TodoItem[] {
  if (!text || text.trim().length === 0) return [];

  const sentences = splitSentences(text);
  const todos: TodoItem[] = [];
  const seenTexts = new Set<string>();

  for (const sentence of sentences) {
    // Skip very short sentences
    if (sentence.length < 6) continue;

    // Skip chat messages (speaker labels like "张先生：", "我：")
    if (isChatMessage(sentence)) continue;

    // Skip receipt line items (label + amount, e.g., "月租金：4200元")
    // Strip leading bullet/number markers before checking
    const cleanedForCheck = sentence.trim().replace(/^[\d①②③④⑤⑥⑦⑧⑨⑩]+\s*[.、）)]\s*/, "").replace(/^[-•]\s*/, "").trim();
    if (/^[\u4e00-\u9fa5a-zA-Z]{2,8}[：:]\s*[\d,.]+\s*[元万亿%％]/.test(cleanedForCheck)) continue;
    if (/^[\u4e00-\u9fa5a-zA-Z]{2,8}[（(].*?[)）]\s*[：:]\s*[\d,.]+/.test(cleanedForCheck)) continue;
    // Skip pure amount/number lines
    if (/^[\d,.]+\s*[元万亿%％]?$/.test(cleanedForCheck)) continue;

    // Check for directive words
    let matchedPriority: "high" | "medium" | "low" | null = null;
    for (const { word, priority } of DIRECTIVE_WORDS) {
      if (sentence.includes(word)) {
        matchedPriority = priority;
        break;
      }
    }

    // If no directive word found, check if it's a structured item (numbered list, bullet)
    if (!matchedPriority && isStructuredItem(sentence)) {
      matchedPriority = "medium";
    }

    if (!matchedPriority) continue;

    // Check if sentence contains a date
    const dates = extractDates(sentence);
    const hasDate = dates.length > 0;
    const dueDate = dates.length > 0 ? dates[0].normalized : null;

    // Clean up the sentence - remove leading bullet/number markers
    let todoText = sentence
      .replace(/^[\d①②③④⑤⑥⑦⑧⑨⑩]+\s*[.、）)]\s*/, "")
      .replace(/^[-•]\s*/, "")
      .trim();

    // Truncate
    todoText = todoText.substring(0, 120);
    if (todoText.length < 4) continue;

    const dedupKey = todoText.substring(0, 30);
    if (seenTexts.has(dedupKey)) continue;
    seenTexts.add(dedupKey);

    // Bump priority if has date
    const finalPriority = hasDate ? bumpPriority(matchedPriority) : matchedPriority;

    todos.push({
      id: crypto.randomUUID(),
      text: todoText,
      priority: finalPriority,
      sourceMaterialId: materialId,
      sourceMaterialName: materialName,
      dueDate,
    });
  }

  // Sort: high first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  todos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return todos.slice(0, 20); // Limit to 20 todos
}
