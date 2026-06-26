import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { analyzeCase } from "@/lib/analyzer";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materials } = body as { materials: { id: string; originalName: string; extractedText: string }[] };

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return apiError("没有可分析的材料", 400);
    }

    const result = analyzeCase(materials);
    return apiResponse(result);
  } catch (error: any) {
    return apiError(`分析失败: ${error.message}`, 500);
  }
}
