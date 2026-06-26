"use client";

import { Calendar, FileText } from "lucide-react";
import { TimelineEntry } from "@/lib/analyzer/types";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";

export function TimelineView({ entries }: { entries: TimelineEntry[] }) {
  const { t } = useI18n();
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="mb-3 h-12 w-12 text-muted opacity-50" />
        <p className="text-sm text-muted">{t("timeline.empty")}</p>
        <p className="mt-1 text-xs text-muted">{t("timeline.empty.desc")}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {entries.map((entry, idx) => (
          <div key={idx} className="relative pl-12">
            {/* Dot on timeline */}
            <div className="absolute left-2.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-accent bg-background">
              <div className="h-1 w-1 rounded-full bg-accent" />
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  <Calendar className="mr-1 h-3 w-3" />
                  {entry.date}
                </Badge>
                {entry.normalizedDate && (
                  <span className="text-xs text-muted">{t("timeline.normalized")}: {entry.normalizedDate}</span>
                )}
              </div>
              <h4 className="font-semibold text-foreground">{entry.title}</h4>
              {entry.description && (
                <p className="mt-1 text-sm text-muted">{entry.description}</p>
              )}
              <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                <FileText className="h-3 w-3" />
                {t("timeline.source")}: {entry.sourceMaterialName}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
