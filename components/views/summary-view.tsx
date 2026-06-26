"use client";

import { Quote, ListChecks, Tag } from "lucide-react";
import { Summary } from "@/lib/analyzer/types";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

export function SummaryView({ summary }: { summary: Summary | null }) {
  const { t } = useI18n();
  if (!summary || (!summary.oneLine && !summary.keyPoints?.length)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Quote className="mb-3 h-12 w-12 text-muted opacity-50" />
        <p className="text-sm text-muted">{t("summary.empty")}</p>
        <p className="mt-1 text-xs text-muted">{t("summary.empty.desc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* One-line summary */}
      {summary.oneLine && (
        <Card className="border-l-4 border-l-accent bg-accent-light/30">
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
              <Quote className="h-4 w-4" />
              {t("summary.oneline")}
            </div>
            <p className="text-lg font-semibold leading-relaxed text-foreground">
              {summary.oneLine}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key points */}
      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <ListChecks className="h-4 w-4 text-accent" />
            {t("summary.keypoints")}
          </h3>
          <div className="space-y-2">
            {summary.keyPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex gap-3 rounded-lg border border-border bg-background p-3"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-bold text-accent">
                  {idx + 1}
                </span>
                <p className="text-sm text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {summary.keywords && summary.keywords.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Tag className="h-4 w-4 text-accent2" />
            {t("summary.keywords")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="rounded-full bg-bg2 px-3 py-1 text-xs font-medium text-foreground"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
