import { NextRequest } from "next/server";
import crypto from "crypto";
import { apiResponse, apiError } from "@/lib/utils";
import { getAgnesClient } from "@/lib/agnes/client";
import { AGNES_CONFIG, isAIEnabled } from "@/lib/agnes/config";
import { checkImageCredits, consumeCredit } from "@/lib/agnes/image-rate-limit";

export const maxDuration = 60;
export const runtime = "nodejs";

const VALID_SIZES = ["1024x1024", "1024x768", "768x1024"];
const MAX_PROMPT_LENGTH = 2000;
const MAX_DEVICE_ID_LENGTH = 100;

// Use Node.js crypto.timingSafeEqual for constant-time comparison
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Handle length difference in constant time by comparing against fixed-length buffers
  if (bufA.length !== bufB.length) {
    // Still do a comparison to equalize timing, then return false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function isDeveloper(developerKey: string | undefined): boolean {
  const envKey = process.env.DEVELOPER_KEY;
  if (!envKey || !developerKey) return false;
  if (developerKey.length > 200) return false; // Reject absurdly long keys
  return safeCompare(developerKey, envKey);
}

// Validate deviceId format (UUID v4 or similar)
function isValidDeviceId(id: string): boolean {
  if (!id || id.length > MAX_DEVICE_ID_LENGTH) return false;
  // Accept UUID format or alphanumeric strings (our client generates UUIDs)
  return /^[a-f0-9-]{36}$/i.test(id) || /^[a-zA-Z0-9_-]{8,100}$/.test(id);
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

    // Validate deviceId format
    if (!deviceId?.trim() || !isValidDeviceId(deviceId)) {
      return apiError("设备标识无效", 400);
    }

    // Check developer bypass
    const devMode = isDeveloper(developerKey);

    // Get client IP for secondary tracking (defense in depth)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Credit check (skip for developers)
    if (!devMode) {
      const creditCheck = checkImageCredits(deviceId, clientIp);
      if (!creditCheck.allowed) {
        return Response.json(
          {
            success: false,
            data: null,
            error: `今日生成次数已用完（每日 ${creditCheck.limit} 次），请明天再来`,
            remaining: 0,
            limit: creditCheck.limit,
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
      // Generation returned no URL — show user-friendly error
      if (!devMode) {
        // Don't consume credit on failure
      }
      return apiError("服务器繁忙，请稍后重试", 503);
    }

    // Consume credit only on successful generation (non-developers only)
    let remaining = -1;
    if (!devMode) {
      consumeCredit(deviceId, clientIp);
      const afterCheck = checkImageCredits(deviceId, clientIp);
      remaining = afterCheck.remaining;
    }

    return apiResponse({
      url: imageUrl,
      prompt: prompt.trim(),
      size,
      developer: devMode,
      remaining,
    });
  } catch (error: any) {
    console.error("[Agnes AI] Image generation error:", error.message);
    // All failures show "服务器繁忙" to the user (no technical details leaked)
    return apiError("服务器繁忙，请稍后重试", 503);
  }
}
