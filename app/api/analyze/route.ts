import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { analyzeCase } from "@/lib/analyzer";
import { analyzeCaseWithAI } from "@/lib/agnes/analyzer";
import { isAIEnabled } from "@/lib/agnes/config";
import { checkRateLimit } from "@/lib/agnes/rate-limit";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materials } = body as { materials: { id: string; originalName: string; extractedText: string }[] };

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return apiError("没有可分析的材料", 400);
    }

    // AI path
    if (isAIEnabled()) {
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        return apiError("请求过于频繁，请稍等片刻再试", 429);
      }

      try {
        const result = await analyzeCaseWithAI(materials);
        return apiResponse({ ...result, engine: "agnes-ai" });
      } catch (aiError: any) {
        console.error("[Agnes AI] 分析失败，降级到规则引擎:", aiError.message);
        const result = analyzeCase(materials);
        return apiResponse({ ...result, engine: "rules-fallback" });
      }
    }

    // Rule engine path (no API key)
    const result = analyzeCase(materials);
    return apiResponse({ ...result, engine: "rules" });
  } catch (error: any) {
    return apiError(`分析失败: ${error.message}`, 500);
  }
}
