import { getAgnesClient } from "./client";
import { AGNES_CONFIG } from "./config";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./prompts";
import { analyzeCase, InputMaterial } from "@/lib/analyzer";
import type { AnalysisResult, TimelineEntry, Summary, TodoItem, Suggestion } from "@/lib/analyzer/types";
import { extractDates } from "@/lib/analyzer/date-extractor";
import { extractEntities } from "@/lib/analyzer/entity-extractor";
import { categorize } from "@/lib/analyzer/categorizer";

/**
 * AI-enhanced analysis: runs rule engine first for deterministic extraction,
 * then calls agnes-2.0-flash for semantic understanding (summary, todos, suggestions).
 * Falls back to rule engine on any error.
 */
export async function analyzeCaseWithAI(materials: InputMaterial[]): Promise<AnalysisResult> {
  // Step 1: Run rule engine for deterministic extraction
  const ruleResult = analyzeCase(materials);

  // Step 2: Build structured hints from rule engine
  const hints = extractRuleHints(materials);

  // Step 3: Call Agnes AI
  const client = getAgnesClient();
  const completion = await client.chat.completions.create({
    model: AGNES_CONFIG.models.chat,
    messages: [
      { role: "system", content: buildAnalysisSystemPrompt() },
      { role: "user", content: buildAnalysisUserPrompt(materials, hints) },
    ],
    temperature: 0.3,
    max_tokens: AGNES_CONFIG.limits.maxAnalysisOutputTokens,
  });

  const rawContent = completion.choices[0]?.message?.content || "";

  // Step 4: Parse JSON with multi-level fallback
  const aiResult = parseAnalysisResponse(rawContent);

  // Step 5: Merge — AI result takes priority, rule engine fills gaps
  return mergeResults(aiResult, ruleResult, materials);
}

function extractRuleHints(materials: InputMaterial[]) {
  const dates: { raw: string; normalized: string | null }[] = [];
  const amounts: { raw: string }[] = [];
  const people: string[] = [];
  const categories: string[] = [];

  for (const m of materials) {
    const d = extractDates(m.extractedText || "");
    d.slice(0, 20).forEach(date => dates.push({ raw: date.raw, normalized: date.normalized }));

    const e = extractEntities(m.extractedText || "");
    e.amounts.slice(0, 10).forEach(a => amounts.push({ raw: a.raw }));
    people.push(...e.people.slice(0, 10));

    categories.push(categorize(m.extractedText || ""));
  }

  return {
    dates: dates.slice(0, 30),
    entities: { phones: [], amounts: amounts.slice(0, 15), people: [...new Set(people)].slice(0, 15) },
    categories: [...new Set(categories)],
  };
}

function parseAnalysisResponse(content: string): Partial<AnalysisResult> {
  // Level 1: Direct parse
  try {
    return JSON.parse(content);
  } catch { /* continue */ }

  // Level 2: Extract from ```json ... ``` code block
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch { /* continue */ }
  }

  // Level 3: Extract from first { to last }
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(content.substring(firstBrace, lastBrace + 1));
    } catch { /* continue */ }
  }

  throw new Error("Failed to parse AI response as JSON");
}

function mergeResults(
  ai: Partial<AnalysisResult>,
  rule: AnalysisResult,
  materials: InputMaterial[]
): AnalysisResult {
  const materialMap = new Map(materials.map(m => [m.originalName, m.id]));

  // Timeline: use AI if non-empty, else rule engine
  const timeline: TimelineEntry[] = (ai.timeline && ai.timeline.length > 0)
    ? ai.timeline.map(t => ({
        date: t.date || "",
        normalizedDate: t.normalizedDate || null,
        title: t.title || "",
        description: t.description || "",
        sourceMaterialId: materialMap.get(t.sourceMaterialName || "") || materials[0]?.id || "",
        sourceMaterialName: t.sourceMaterialName || "",
      }))
    : rule.timeline;

  // Summary: use AI if has content, else rule engine
  const summary: Summary = (ai.summary && (ai.summary.oneLine || (ai.summary.keyPoints && ai.summary.keyPoints.length > 0)))
    ? {
        oneLine: ai.summary.oneLine || rule.summary.oneLine,
        keyPoints: ai.summary.keyPoints || rule.summary.keyPoints,
        keywords: ai.summary.keywords || rule.summary.keywords,
      }
    : rule.summary;

  // Todos: use AI if non-empty, else rule engine
  const todos: TodoItem[] = (ai.todos && ai.todos.length > 0)
    ? ai.todos.map(t => ({
        id: crypto.randomUUID(),
        text: t.text || "",
        priority: (["high", "medium", "low"].includes(t.priority) ? t.priority : "medium") as "high" | "medium" | "low",
        sourceMaterialId: materialMap.get(t.sourceMaterialName || "") || materials[0]?.id || "",
        sourceMaterialName: t.sourceMaterialName || "",
        dueDate: t.dueDate || null,
      }))
    : rule.todos;

  // Suggestions: use AI if non-empty, else rule engine
  const suggestions: Suggestion[] = (ai.suggestions && ai.suggestions.length > 0)
    ? ai.suggestions.map(s => ({
        title: s.title || "",
        rationale: s.rationale || "",
        action: s.action || "",
        priority: (["high", "medium", "low"].includes(s.priority) ? s.priority : "medium") as "high" | "medium" | "low",
      }))
    : rule.suggestions;

  return { timeline, summary, todos, suggestions, engine: "agnes-ai" };
}
