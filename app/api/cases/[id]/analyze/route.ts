import { NextRequest } from "next/server";
import { store } from "@/lib/store";
import { apiResponse, apiError } from "@/lib/utils";
import { processText, cleanChatLog } from "@/lib/processors/text";
import { processPdf } from "@/lib/processors/pdf";
import { processImage } from "@/lib/processors/image";
import { analyzeCase } from "@/lib/analyzer";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const caseData = store.getCase(id);
    if (!caseData) {
      return apiError("案件不存在", 404);
    }

    const caseMaterials = store.getMaterialsByCaseId(id);
    if (caseMaterials.length === 0) {
      return apiError("案件中没有材料，请先上传文件", 400);
    }

    // Set case status to extracting
    store.updateCaseStatus(id, "extracting");

    // Phase A: Extract text from each material
    for (const material of caseMaterials) {
      if (material.status === "extracted") continue;

      store.updateMaterial(material.id, { status: "extracting" });

      try {
        let extractedText = "";

        if (material.category === "text") {
          const buffer = store.getFileBuffer(material.storageKey);
          if (buffer) {
            extractedText = cleanChatLog(processText(buffer));
          }
        } else if (material.category === "pdf") {
          const result = await processPdf(material.storageKey);
          extractedText = result.text;
        } else if (material.category === "image") {
          extractedText = await processImage(material.storageKey);
        }

        store.updateMaterial(material.id, {
          status: "extracted",
          extractedText,
        });
      } catch (err: any) {
        store.updateMaterial(material.id, {
          status: "failed",
          errorMsg: err.message,
        });
      }
    }

    // Set case status to analyzing
    store.updateCaseStatus(id, "analyzing");

    // Phase B: Run analysis engine
    const extractedMaterials = store
      .getMaterialsByCaseId(id)
      .filter((m) => m.status === "extracted" && m.extractedText);

    const inputMaterials = extractedMaterials.map((m) => ({
      id: m.id,
      originalName: m.originalName,
      extractedText: m.extractedText || "",
    }));

    const result = analyzeCase(inputMaterials);

    // Save analysis result (replaces any existing result for this case)
    const resultId = crypto.randomUUID();
    store.saveAnalysisResult(resultId, id, {
      timeline: JSON.stringify(result.timeline),
      summary: JSON.stringify(result.summary),
      todos: JSON.stringify(result.todos),
      suggestions: JSON.stringify(result.suggestions),
    });

    // Set case status to ready
    store.updateCaseStatus(id, "ready");

    return apiResponse(result);
  } catch (error: any) {
    // Set case status to failed
    store.updateCaseStatus(id, "failed");

    return apiError(`分析失败: ${error.message}`, 500);
  }
}
