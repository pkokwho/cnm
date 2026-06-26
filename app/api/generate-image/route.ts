import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { getAgnesClient } from "@/lib/agnes/client";
import { AGNES_CONFIG, isAIEnabled } from "@/lib/agnes/config";
import { checkImageRateLimit, recordImageGeneration } from "@/lib/agnes/image-rate-limit";

export const maxDuration = 60;
export const runtime = "nodejs";

const VALID_SIZES = ["1024x1024", "1024x768", "768x1024"];
const MAX_PROMPT_LENGTH = 2000;

// Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function isDeveloper(developerKey: string | undefined): boolean {
  const envKey = process.env.DEVELOPER_KEY;
  if (!envKey || !developerKey) return false;
  return safeCompare(developerKey, envKey);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAIEnabled()) {
      return apiError("AI 生图功能未启用（未配置 API Key）", 503);
    }

    const body = await request.json();
    const { prompt, size, deviceId, developerKey } = body as {
      prompt: string;
      size: string;
      deviceId: string;
      developerKey?: string;
    };

    // Validate prompt
    if (!prompt?.trim()) {
      return apiError("提示词不能为空", 400);
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return apiError(`提示词过长（最多 ${MAX_PROMPT_LENGTH} 字符）`, 400);
    }

    // Validate size
    if (!VALID_SIZES.includes(size)) {
      return apiError(`不支持的尺寸，可选: ${VALID_SIZES.join(", ")}`, 400);
    }

    // Validate deviceId
    if (!deviceId?.trim()) {
      return apiError("设备标识缺失", 400);
    }

    // Check developer bypass
    const devMode = isDeveloper(developerKey);

    // Rate limit check (skip for developers)
    if (!devMode) {
      const rateCheck = checkImageRateLimit(deviceId);
      if (!rateCheck.allowed) {
        const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
        return Response.json(
          {
            success: false,
            data: null,
            error: `生成过于频繁，请等待 ${retryAfterSec} 秒后再试`,
            retryAfterSec,
          },
          { status: 429 }
        );
      }
    }

    // Call Agnes AI image generation
    // NOTE: Do NOT pass response_format or extra_body — agnes-image-2.1-flash does not support them
    const client = getAgnesClient();
    const response = await client.images.generate({
      model: AGNES_CONFIG.models.textToImage,
      prompt: prompt.trim(),
      size: size as "1024x1024" | "1024x768" | "768x1024",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      return apiError("图片生成失败：未返回图片 URL", 500);
    }

    // Record successful generation for rate limiting (non-developers only)
    if (!devMode) {
      recordImageGeneration(deviceId);
    }

    return apiResponse({
      url: imageUrl,
      prompt: prompt.trim(),
      size,
      developer: devMode,
    });
  } catch (error: any) {
    console.error("[Agnes AI] Image generation error:", error.message);
    return apiError(`图片生成失败: ${error.message}`, 500);
  }
}
