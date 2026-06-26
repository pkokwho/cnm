import { NextRequest } from "next/server";
import { store } from "@/lib/store";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caseData = store.getCase(id);
    if (!caseData) {
      return apiError("案件不存在", 404);
    }

    const caseMaterials = store.getMaterialsByCaseId(id);

    const extractedCount = caseMaterials.filter(
      (m) => m.status === "extracted"
    ).length;
    const failedCount = caseMaterials.filter(
      (m) => m.status === "failed"
    ).length;
    const total = caseMaterials.length;

    return apiResponse({
      caseStatus: caseData.status,
      materials: caseMaterials.map((m) => ({
        id: m.id,
        name: m.originalName,
        status: m.status,
        category: m.category,
        errorMsg: m.errorMsg,
      })),
      progress: {
        total,
        extracted: extractedCount,
        failed: failedCount,
      },
    });
  } catch (error: any) {
    return apiError(`获取状态失败: ${error.message}`, 500);
  }
}
