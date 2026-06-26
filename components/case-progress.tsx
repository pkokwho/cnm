"use client";

import { Check, Loader2, Upload, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

const STEP_ORDER = ["created", "uploading", "extracting", "analyzing", "ready", "failed"];

export function CaseProgress({ status, materialProgress }: { status: string; materialProgress?: { extracted: number; total: number } }) {
  const { t } = useI18n();

  const STEPS = [
    { key: "uploading", label: t("progress.upload"), icon: Upload },
    { key: "extracting", label: t("progress.extract"), icon: Search },
    { key: "analyzing", label: t("progress.analyze"), icon: Sparkles },
    { key: "ready", label: t("progress.done"), icon: Check },
  ];

  let currentStepIdx = STEP_ORDER.indexOf(status);
  if (status === "created") currentStepIdx = -1;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-bg2 p-4">
      {STEPS.map((step, idx) => {
        const stepIdx = STEP_ORDER.indexOf(step.key);
        const isActive = currentStepIdx === stepIdx;
        const isCompleted = currentStepIdx > stepIdx || status === "ready";
        const isFailed = status === "failed" && isActive;

        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted && "border-accent2 bg-accent2 text-white",
                  isActive && !isFailed && "border-accent bg-accent text-white",
                  isFailed && "border-red-500 bg-red-500 text-white",
                  !isActive && !isCompleted && !isFailed && "border-border bg-background text-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : isActive && !isFailed ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  isActive || isCompleted ? "text-foreground" : "text-muted"
                )}
              >
                {step.label}
              </span>
              {isActive && step.key === "extracting" && materialProgress && (
                <span className="text-xs text-muted">
                  {materialProgress.extracted}/{materialProgress.total}
                </span>
              )}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-colors",
                  currentStepIdx > stepIdx ? "bg-accent2" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
