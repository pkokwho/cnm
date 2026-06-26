"use client";

import { FileText, Image, FileType, CheckCircle, Clock, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

interface Material {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string | null;
  status: string;
  errorMsg: string | null;
}

function getFileIcon(category: string | null) {
  if (category === "image") return <Image className="h-5 w-5 text-blue-500" />;
  if (category === "pdf") return <FileType className="h-5 w-5 text-red-500" />;
  return <FileText className="h-5 w-5 text-gray-500" />;
}

export function MaterialList({
  materials,
  onDelete,
}: {
  materials: Material[];
  onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();

  const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive"; icon: typeof CheckCircle }> = {
    uploaded: { label: t("material.uploaded"), variant: "secondary", icon: Clock },
    extracting: { label: t("material.extracting"), variant: "warning", icon: Loader2 },
    extracted: { label: t("material.extracted"), variant: "success", icon: CheckCircle },
    failed: { label: t("material.failed"), variant: "destructive", icon: AlertCircle },
  };

  if (materials.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        {t("material.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {materials.map((m) => {
        const config = STATUS_CONFIG[m.status] || STATUS_CONFIG.uploaded;
        const Icon = config.icon;
        return (
          <div
            key={m.id}
            className="flex items-center gap-2 rounded-md border border-border bg-background p-3 sm:gap-3"
          >
            <div className="flex-shrink-0">{getFileIcon(m.category)}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.originalName}</p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{formatBytes(m.sizeBytes)}</span>
                {m.errorMsg && <span className="text-red-500">— {m.errorMsg}</span>}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
              <Badge variant={config.variant}>
                <Icon className={`mr-1 h-3 w-3 ${m.status === "extracting" ? "animate-spin" : ""}`} />
                {config.label}
              </Badge>
              {onDelete && m.status === "uploaded" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-red-500"
                  onClick={() => onDelete(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
