"use client";

import { Lightbulb, AlertCircle, ArrowRight } from "lucide-react";
import { Suggestion } from "@/lib/analyzer/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

export function SuggestionsView({ suggestions }: { suggestions: Suggestion[] }) {
  const { t } = useI18n();

  const PRIORITY_CONFIG: Record<string, { label: string; variant: "destructive" | "warning" | "success" }> = {
    high: { label: t("suggestions.priority.high"), variant: "destructive" },
    medium: { label: t("suggestions.priority.medium"), variant: "warning" },
    low: { label: t("suggestions.priority.low"), variant: "success" },
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Lightbulb className="mb-3 h-12 w-12 text-muted opacity-50" />
        <p className="text-sm text-muted">{t("suggestions.empty")}</p>
        <p className="mt-1 text-xs text-muted">{t("suggestions.empty.desc")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {suggestions.map((suggestion, idx) => {
        const config = PRIORITY_CONFIG[suggestion.priority] || PRIORITY_CONFIG.low;
        return (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light">
                    <Lightbulb className="h-4 w-4 text-accent" />
                  </div>
                  <h4 className="font-bold text-foreground">{suggestion.title}</h4>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>

              <div className="space-y-3">
                <div className="rounded-md bg-amber-50 p-3">
                  <p className="flex items-start gap-2 text-xs text-amber-800">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      <strong>{t("suggestions.why")}</strong>
                      {suggestion.rationale}
                    </span>
                  </p>
                </div>

                <div className="flex items-start gap-2 text-sm text-foreground">
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent2" />
                  <span>
                    <strong className="text-accent2">{t("suggestions.how")}</strong>
                    {suggestion.action}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
