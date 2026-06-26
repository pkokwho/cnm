"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDropzone } from "@/components/upload-dropzone";
import { MaterialList } from "@/components/material-list";
import { CaseProgress } from "@/components/case-progress";
import { ResultTabs } from "@/components/result-tabs";
import type { AnalysisResult } from "@/lib/analyzer/types";
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

interface CaseDetail {
  id: string;
  title: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  materials: Material[];
  analysisResult: any | null;
}

export default function CaseWorkspacePage() {
  const params = useParams();
  const caseId = params.id as string;
  const { t } = useI18n();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [materialProgress, setMaterialProgress] = useState<{ extracted: number; total: number } | undefined>();
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      if (data.success) {
        setCaseData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch case:", err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // SSE for progress updates
  useEffect(() => {
    if (!caseData) return;
    if (!["extracting", "analyzing"].includes(caseData.status)) return;

    let closed = false;
    const eventSource = new EventSource(`/api/cases/${caseId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          setCaseData((prev) => prev ? { ...prev, status: data.stage } : prev);
          if (data.materialProgress) {
            setMaterialProgress(data.materialProgress);
          }
          // Refresh case data to get updated material statuses
          if (data.stage === "analyzing" || data.stage === "ready") {
            fetchCase();
          }
        } else if (data.type === "complete") {
          closed = true;
          setAnalyzing(false);
          fetchCase();
          eventSource.close();
        } else if (data.type === "error") {
          closed = true;
          setAnalyzing(false);
          fetchCase();
          eventSource.close();
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      if (closed) return; // Already handled by complete/error
      closed = true;
      eventSource.close();
      // Fallback: poll status
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/cases/${caseId}/status`);
          const data = await res.json();
          if (data.success) {
            const { caseStatus, progress } = data.data;
            setMaterialProgress(progress);
            setCaseData((prev) => prev ? { ...prev, status: caseStatus } : prev);

            if (caseStatus === "ready" || caseStatus === "failed") {
              setAnalyzing(false);
              clearInterval(interval);
              fetchCase();
            }
          }
        } catch (err) {
          // ignore
        }
      }, 2000);
    };

    return () => {
      closed = true;
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [caseData?.status, caseId, fetchCase]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Analysis completed synchronously (POST blocks until done)
        // Refresh case data and reset analyzing state
        await fetchCase();
        setAnalyzing(false);
      } else {
        setAnalyzing(false);
        alert(data.error || t("error.analyzeFailed"));
      }
    } catch (err: any) {
      setAnalyzing(false);
      alert(`${t("error.analyzeFailed")}: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">{t("case.notFound")}</p>
        <Link href="/app">
          <Button variant="secondary" className="mt-4">{t("case.backToList")}</Button>
        </Link>
      </div>
    );
  }

  const hasMaterials = caseData.materials.length > 0;
  // Materials can be "uploaded" (not yet processed), "extracted", or "failed"
  // The extraction happens during analysis, so we allow starting analysis as long as materials exist
  const isProcessing = ["extracting", "analyzing"].includes(caseData.status);

  // Parse analysis result
  const analysisResult: AnalysisResult | null = caseData.analysisResult
    ? {
        timeline: typeof caseData.analysisResult.timeline === "string"
          ? JSON.parse(caseData.analysisResult.timeline)
          : caseData.analysisResult.timeline,
        summary: typeof caseData.analysisResult.summary === "string"
          ? JSON.parse(caseData.analysisResult.summary)
          : caseData.analysisResult.summary,
        todos: typeof caseData.analysisResult.todos === "string"
          ? JSON.parse(caseData.analysisResult.todos)
          : caseData.analysisResult.todos,
        suggestions: typeof caseData.analysisResult.suggestions === "string"
          ? JSON.parse(caseData.analysisResult.suggestions)
          : caseData.analysisResult.suggestions,
      }
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/app">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("case.back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{caseData.title}</h1>
      </div>

      {/* Progress */}
      {(hasMaterials || isProcessing) && (
        <div className="mb-6">
          <CaseProgress status={caseData.status} materialProgress={materialProgress} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Upload + Materials */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("case.upload.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadDropzone caseId={caseId} onUploaded={fetchCase} />
            </CardContent>
          </Card>

          {hasMaterials && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{t("case.materials.title")}</span>
                  <span className="text-sm font-normal text-muted">{caseData.materials.length} {t("case.materials.count")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MaterialList materials={caseData.materials} />
              </CardContent>
            </Card>
          )}

          {/* Analyze button */}
          {hasMaterials && !isProcessing && caseData.status !== "ready" && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("case.analyzing")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("case.analyze")}
                </>
              )}
            </Button>
          )}

          {caseData.status === "ready" && (
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("case.reanalyzing")}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t("case.reanalyze")}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Right: Results */}
        <div>
          <Card>
            <CardContent className="pt-6">
              <ResultTabs
                result={analysisResult}
                caseId={caseId}
                caseTitle={caseData.title}
                loading={isProcessing && !analysisResult}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
