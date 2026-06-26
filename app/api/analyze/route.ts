import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { analyzeCase } from "@/lib/analyzer";
import { analyzeCaseWithAI } from "@/lib/agnes/analyzer";
import { isAIEnabled } from "@/lib/agnes/config";
import { checkRateLimit } from "@/lib/agnes/rate-limit";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_MATERIALS_COUNT = 50;
const MAX_MATERIAL_TEXT_LENGTH = 50000;
const MAX_MATERIAL_NAME_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materials } = body as { materials: { id: string; originalName: string; extractedText: string }[] };

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return apiError("没有可分析的材料", 400);
    }

    // Cap materials count and validate each item
    const safeMaterials = materials.slice(0, MAX_MATERIALS_COUNT).map(m => ({
      id: typeof m.id === "string" ? m.id.substring(0, 100) : "",
      originalName: typeof m.originalName === "string"
        ? m.originalName.substring(0, MAX_MATERIAL_NAME_LENGTH)
        : "unknown",
      extractedText: typeof m.extractedText === "string"
        ? m.extractedText.substring(0, MAX_MATERIAL_TEXT_LENGTH)
        : "",
    }));

    // AI path
    if (isAIEnabled()) {
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        return apiError("请求过于频繁，请稍等片刻再试", 429);
      }

      try {
        const result = await analyzeCaseWithAI(safeMaterials);
        return apiResponse({ ...result, engine: "agnes-ai" });
      } catch (aiError: any) {
        console.error("[Agnes AI] 分析失败，降级到规则引擎:", aiError.message);
        const result = analyzeCase(safeMaterials);
        return apiResponse({ ...result, engine: "rules-fallback" });
      }
    }

    // Rule engine path (no API key)
    const result = analyzeCase(safeMaterials);
    return apiResponse({ ...result, engine: "rules" });
  } catch (error: any) {
    console.error("[Analyze API] Error:", error.message);
    return apiError("服务器繁忙，请稍后重试", 500);
  }
}
