"use client";

import { useState } from "react";
import { Calendar, FileText, CheckSquare, Lightbulb, Download, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimelineView } from "@/components/views/timeline-view";
import { SummaryView } from "@/components/views/summary-view";
import { TodosView } from "@/components/views/todos-view";
import { SuggestionsView } from "@/components/views/suggestions-view";
import { AIChat } from "@/components/ai-chat";
import type { AnalysisResult, TimelineEntry, Summary, TodoItem, Suggestion } from "@/lib/analyzer/types";
import { useI18n } from "@/lib/i18n/context";
import * as clientStore from "@/lib/client-store";

interface ResultTabsProps {
  result: AnalysisResult | null;
  caseId: string;
  caseTitle: string;
  loading?: boolean;
}

export function ResultTabs({ result, caseId, caseTitle, loading }: ResultTabsProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("timeline");

  // Get extracted materials for AI chat context
  const getChatMaterials = (cid: string) => {
    return clientStore
      .getMaterialsByCaseId(cid)
      .filter((m) => m.status === "extracted" && m.extractedText)
      .map((m) => ({
        originalName: m.originalName,
        extractedText: m.extractedText || "",
      }));
  };

  const handleExport = () => {
    if (!result) return;

    let md = `# ${caseTitle} — ${t("export.title")}\n\n`;
    md += `> ${t("export.generated")}\n\n`;

    // Timeline
    md += `## 📅 ${t("export.timeline")}\n\n`;
    if (result.timeline.length > 0) {
      for (const entry of result.timeline) {
        md += `### ${entry.date}${entry.normalizedDate ? ` (${entry.normalizedDate})` : ""}\n`;
        md += `- **${t("export.event")}**: ${entry.title}\n`;
        md += `- **${t("export.detail")}**: ${entry.description}\n`;
        md += `- **${t("export.source")}**: ${entry.sourceMaterialName}\n\n`;
      }
    } else {
      md += `${t("export.noTimeline")}\n\n`;
    }

    // Summary
    md += `## 📝 ${t("export.summary")}\n\n`;
    md += `**${t("export.oneline")}**: ${result.summary.oneLine}\n\n`;
    if (result.summary.keyPoints.length > 0) {
      md += `**${t("export.keypoints")}**:\n`;
      for (const point of result.summary.keyPoints) {
        md += `- ${point}\n`;
      }
      md += `\n`;
    }
    if (result.summary.keywords.length > 0) {
      md += `**${t("export.keywords")}**: ${result.summary.keywords.join("、")}\n\n`;
    }

    // Todos
    md += `## ✅ ${t("export.todos")}\n\n`;
    if (result.todos.length > 0) {
      const groups: Record<string, TodoItem[]> = { high: [], medium: [], low: [] };
      for (const todo of result.todos) {
        if (!groups[todo.priority]) groups[todo.priority] = [];
        groups[todo.priority].push(todo);
      }
      const labels: Record<string, string> = { high: t("todos.high"), medium: t("todos.medium"), low: t("todos.low") };
      for (const priority of ["high", "medium", "low"]) {
        if (groups[priority]?.length > 0) {
          md += `### ${labels[priority]}\n`;
          for (const todo of groups[priority]) {
            md += `- [ ] ${todo.text}${todo.dueDate ? ` (${t("export.deadline")}: ${todo.dueDate})` : ""}\n`;
          }
          md += `\n`;
        }
      }
    } else {
      md += `${t("export.noTodos")}\n\n`;
    }

    // Suggestions
    md += `## 💡 ${t("export.suggestions")}\n\n`;
    if (result.suggestions.length > 0) {
      for (const s of result.suggestions) {
        md += `### ${s.title}\n`;
        md += `- **${t("export.priority")}**: ${s.priority}\n`;
        md += `- **为什么**: ${s.rationale}\n`;
        md += `- **怎么做**: ${s.action}\n\n`;
      }
    } else {
      md += `${t("export.noSuggestions")}\n\n`;
    }

    // Download
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseTitle}-${t("export.title")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3 text-muted">{t("result.loading")}</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-3 h-12 w-12 text-muted opacity-50" />
        <p className="text-sm text-muted">{t("result.empty")}</p>
        <p className="mt-1 text-xs text-muted">{t("result.empty.desc")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{t("result.title")}</h2>
          {result.engine === "agnes-ai" && (
            <Badge variant="default" className="text-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              {t("engine.ai")}
            </Badge>
          )}
          {result.engine === "rules-fallback" && (
            <Badge variant="secondary" className="text-xs">
              {t("engine.fallback")}
            </Badge>
          )}
          {result.engine === "rules" && (
            <Badge variant="secondary" className="text-xs">
              {t("engine.rules")}
            </Badge>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {t("result.export")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline">
            <Calendar className="mr-1.5 h-4 w-4" />
            {t("result.tab.timeline")}
            {result.timeline.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent-light px-1.5 text-xs text-accent">
                {result.timeline.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="summary">
            <FileText className="mr-1.5 h-4 w-4" />
            {t("result.tab.summary")}
          </TabsTrigger>
          <TabsTrigger value="todos">
            <CheckSquare className="mr-1.5 h-4 w-4" />
            {t("result.tab.todos")}
            {result.todos.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent-light px-1.5 text-xs text-accent">
                {result.todos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Lightbulb className="mr-1.5 h-4 w-4" />
            {t("result.tab.suggestions")}
            {result.suggestions.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent-light px-1.5 text-xs text-accent">
                {result.suggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-1.5 h-4 w-4" />
            {t("result.tab.chat")}
            <Sparkles className="ml-0.5 h-3 w-3 text-accent" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <TimelineView entries={result.timeline} />
        </TabsContent>
        <TabsContent value="summary" className="mt-6">
          <SummaryView summary={result.summary} />
        </TabsContent>
        <TabsContent value="todos" className="mt-6">
          <TodosView todos={result.todos} caseId={caseId} />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-6">
          <SuggestionsView suggestions={result.suggestions} />
        </TabsContent>
        <TabsContent value="chat" className="mt-6">
          <AIChat
            caseId={caseId}
            materials={getChatMaterials(caseId)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
