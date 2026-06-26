"use client";

import { useState, useEffect, useCallback } from "react";
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
import * as clientStore from "@/lib/client-store";

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

  const refreshCase = useCallback(() => {
    const c = clientStore.getCase(caseId);
    if (!c) {
      setCaseData(null);
      setLoading(false);
      return;
    }
    const materials = clientStore.getMaterialsByCaseId(caseId);
    const result = clientStore.getAnalysisResult(caseId);
    setCaseData({
      ...c,
      materials: materials.map((m) => ({
        id: m.id,
        originalName: m.originalName,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes,
        category: m.category,
        status: m.status,
        errorMsg: m.errorMsg,
      })),
      analysisResult: result,
    });
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    refreshCase();
  }, [refreshCase]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    clientStore.updateCaseStatus(caseId, "extracting");

    const materials = clientStore.getMaterialsByCaseId(caseId);
    if (materials.length === 0) {
      setAnalyzing(false);
      return;
    }

    const total = materials.length;
    let extracted = 0;
    setMaterialProgress({ extracted: 0, total });
    refreshCase();

    // Phase A: Extract text from each material via API
    for (const material of materials) {
      if (material.status === "extracted" && material.extractedText) {
        extracted++;
        setMaterialProgress({ extracted, total });
        continue;
      }

      clientStore.updateMaterial(material.id, { status: "extracting" });
      refreshCase();

      try {
        // Get file blob from IndexedDB
        const blob = await clientStore.getFileBlob(material.id);
        if (!blob) {
          clientStore.updateMaterial(material.id, { status: "failed", errorMsg: "文件未找到" });
          extracted++;
          setMaterialProgress({ extracted, total });
          continue;
        }

        // Send to extract API
        const formData = new FormData();
        const file = new File([blob], material.originalName, { type: material.mimeType });
        formData.append("file", file);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        const res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (data.success) {
          clientStore.updateMaterial(material.id, {
            status: "extracted",
            extractedText: data.data.text,
          });
        } else {
          clientStore.updateMaterial(material.id, {
            status: "failed",
            errorMsg: data.error || "提取失败",
          });
        }
      } catch (err: any) {
        clientStore.updateMaterial(material.id, {
          status: "failed",
          errorMsg: err.name === "AbortError" ? "超时" : err.message,
        });
      }
      extracted++;
      setMaterialProgress({ extracted, total });
      refreshCase();
    }

    // Phase B: Analyze
    clientStore.updateCaseStatus(caseId, "analyzing");
    refreshCase();

    const extractedMaterials = clientStore
      .getMaterialsByCaseId(caseId)
      .filter((m) => m.status === "extracted" && m.extractedText)
      .map((m) => ({
        id: m.id,
        originalName: m.originalName,
        extractedText: m.extractedText || "",
      }));

    if (extractedMaterials.length === 0) {
      clientStore.saveAnalysisResult(caseId, { timeline: [], summary: { oneLine: "", keyPoints: [], keywords: [] }, todos: [], suggestions: [] });
      clientStore.updateCaseStatus(caseId, "ready");
      setAnalyzing(false);
      setMaterialProgress(undefined);
      refreshCase();
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials: extractedMaterials }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success) {
        clientStore.saveAnalysisResult(caseId, data.data);
        clientStore.updateCaseStatus(caseId, "ready");
      } else {
        clientStore.updateCaseStatus(caseId, "failed");
      }
    } catch (err: any) {
      clientStore.updateCaseStatus(caseId, "failed");
    }

    setAnalyzing(false);
    setMaterialProgress(undefined);
    refreshCase();
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
  const isProcessing = ["extracting", "analyzing"].includes(caseData.status);

  const analysisResult: AnalysisResult | null = caseData.analysisResult
    ? {
        timeline: caseData.analysisResult.timeline || [],
        summary: caseData.analysisResult.summary || { oneLine: "", keyPoints: [], keywords: [] },
        todos: caseData.analysisResult.todos || [],
        suggestions: caseData.analysisResult.suggestions || [],
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
              <UploadDropzone caseId={caseId} onUploaded={refreshCase} />
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
