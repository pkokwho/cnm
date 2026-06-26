import {
  AnalysisResult,
  MaterialAnalysis,
  Summary,
} from "./types";
import { extractDates } from "./date-extractor";
import { extractEntities } from "./entity-extractor";
import { categorize } from "./categorizer";
import { summarize } from "./summarizer";
import { extractTodos } from "./todo-extractor";
import { generateSuggestions } from "./suggestion-generator";
import { buildTimeline } from "./timeline-builder";
import { splitSentences, tokenize, wordFrequency } from "./tokenizers";

export interface InputMaterial {
  id: string;
  originalName: string;
  extractedText: string;
}

export function analyzeCase(materials: InputMaterial[]): AnalysisResult {
  // Analyze each material individually
  const analyses: MaterialAnalysis[] = [];
  const allTexts: string[] = [];
  const allAmounts: { value: number; currency: string; raw: string }[] = [];
  const allCategories: string[] = [];
  let hasChatLogs = false;

  for (const material of materials) {
    const text = material.extractedText || "";

    const dates = extractDates(text);
    const entities = extractEntities(text);
    const category = categorize(text);

    if (category === "chat") hasChatLogs = true;
    allCategories.push(category);
    allAmounts.push(...entities.amounts);
    allTexts.push(text);

    // Key statements: top 3 sentences by word frequency score
    const sentences = splitSentences(text);
    const freq = wordFrequency(text);
    const scored = sentences.map((s, i) => {
      let score = 0;
      const tokens = tokenize(s);
      const tokenSet = new Set(tokens);
      for (const t of tokenSet) score += freq.get(t) || 0;
      if (i < 2) score *= 1.5;
      return { sentence: s, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const keyStatements = scored.slice(0, 3).map((s) => s.sentence.substring(0, 100));

    analyses.push({
      materialId: material.id,
      originalName: material.originalName,
      text,
      dates,
      entities,
      category,
      keyStatements,
    });
  }

  // Build timeline from all analyses
  const timeline = buildTimeline(analyses);

  // Overall summary from combined text
  const combinedText = allTexts.join("\n\n");
  const summary: Summary = summarize(combinedText);

  // Extract todos from all materials
  const allTodos = [];
  for (const analysis of analyses) {
    const todos = extractTodos(analysis.text, analysis.materialId, analysis.originalName);
    allTodos.push(...todos);
  }

  // Generate suggestions
  const suggestions = generateSuggestions(
    [...new Set(allCategories)],
    allAmounts,
    allTodos,
    hasChatLogs
  );

  return {
    timeline,
    summary,
    todos: allTodos,
    suggestions,
  };
}
