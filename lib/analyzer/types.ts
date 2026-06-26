export interface ExtractedDate {
  raw: string;
  normalized: string | null;
  time: string | null;
  context: string;
}

export interface ExtractedEntity {
  phones: string[];
  emails: string[];
  amounts: { value: number; currency: string; raw: string }[];
  people: string[];
  organizations: string[];
}

export interface MaterialAnalysis {
  materialId: string;
  originalName: string;
  text: string;
  dates: ExtractedDate[];
  entities: ExtractedEntity;
  category: string;
  keyStatements: string[];
}

export interface TimelineEntry {
  date: string;
  normalizedDate: string | null;
  title: string;
  description: string;
  sourceMaterialId: string;
  sourceMaterialName: string;
}

export interface Summary {
  oneLine: string;
  keyPoints: string[];
  keywords: string[];
}

export interface TodoItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  sourceMaterialId: string;
  sourceMaterialName: string;
  dueDate: string | null;
}

export interface Suggestion {
  title: string;
  rationale: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface AnalysisResult {
  timeline: TimelineEntry[];
  summary: Summary;
  todos: TodoItem[];
  suggestions: Suggestion[];
  engine?: "rules" | "rules-fallback" | "agnes-ai";
}
