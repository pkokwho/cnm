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
    const result = store.getAnalysisResult(id) || null;

    return apiResponse({
      ...caseData,
      materials: caseMaterials,
      analysisResult: result,
    });
  } catch (error: any) {
    return apiError(`获取案件详情失败: ${error.message}`, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // The store deletes attached files, materials and analysis results.
    store.deleteCase(id);

    return apiResponse({ deleted: true });
  } catch (error: any) {
    return apiError(`删除案件失败: ${error.message}`, 500);
  }
}
