"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Square, FileText, Calendar } from "lucide-react";
import { TodoItem } from "@/lib/analyzer/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

export function TodosView({ todos, caseId }: { todos: TodoItem[]; caseId: string }) {
  const { t } = useI18n();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    high: { label: t("todos.high"), color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
    medium: { label: t("todos.medium"), color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    low: { label: t("todos.low"), color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  };

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`todos-${caseId}`);
    if (stored) {
      try {
        setDoneIds(new Set(JSON.parse(stored)));
      } catch {
        // ignore
      }
    }
  }, [caseId]);

  // Save to localStorage
  const toggleTodo = (id: string) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(`todos-${caseId}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  if (!todos || todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckSquare className="mb-3 h-12 w-12 text-muted opacity-50" />
        <p className="text-sm text-muted">{t("todos.empty")}</p>
        <p className="mt-1 text-xs text-muted">{t("todos.empty.desc")}</p>
      </div>
    );
  }

  // Group by priority
  const groups: Record<string, TodoItem[]> = { high: [], medium: [], low: [] };
  for (const todo of todos) {
    if (!groups[todo.priority]) groups[todo.priority] = [];
    groups[todo.priority].push(todo);
  }

  const groupOrder = ["high", "medium", "low"];

  return (
    <div className="space-y-6">
      {groupOrder.map((priority) => {
        const items = groups[priority];
        if (!items || items.length === 0) return null;
        const config = PRIORITY_CONFIG[priority];

        return (
          <div key={priority}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <span className={cn("rounded px-2 py-0.5", config.bgColor, config.color)}>
                {config.label}
              </span>
              <span className="text-muted">({items.length})</span>
            </h3>
            <div className="space-y-2">
              {items.map((todo) => {
                const isDone = doneIds.has(todo.id);
                return (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-all",
                      isDone ? "border-border bg-bg2 opacity-60" : cn(config.borderColor, config.bgColor)
                    )}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded"
                    >
                      {isDone ? (
                        <CheckSquare className="h-5 w-5 text-accent2" />
                      ) : (
                        <Square className={cn("h-5 w-5", config.color)} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm", isDone && "line-through")}>{todo.text}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {todo.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t("todos.due")}: {todo.dueDate}
                          </span>
                        )}
                        {todo.sourceMaterialName && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {todo.sourceMaterialName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
