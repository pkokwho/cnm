import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/octet-stream", // Fallback for unknown types
];
const MAX_TEXT_LENGTH = 200000; // Cap extracted text to prevent token abuse

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("未找到文件", 400);

    // Server-side file size validation (before reading into memory)
    if (file.size > MAX_FILE_SIZE) {
      return apiError(`文件过大（最大 ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB）`, 413);
    }
    if (file.size === 0) {
      return apiError("文件为空", 400);
    }

    // Validate MIME type
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return apiError("不支持的文件类型", 415);
    }

    // Validate filename length
    const fileName = file.name || "unknown";
    if (fileName.length > 200) {
      return apiError("文件名过长", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    let needsOcr = false;

    if (mimeType === "application/pdf") {
      // Use pdf-parse
      try {
        const pdfParseModule: any = await import("pdf-parse");
        const pdfParse = typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default || pdfParseModule;
        const data = await pdfParse(buffer);
        extractedText = (data.text || "").trim();
        needsOcr = extractedText.length < 50;
      } catch (e) {
        extractedText = "";
      }
    } else if (mimeType.startsWith("image/")) {
      // Use Tesseract.js with 15s timeout
      try {
        const ocrPromise = (async () => {
          const Tesseract = (await import("tesseract.js")).default;
          const result = await Tesseract.recognize(buffer, "chi_sim+eng", { logger: () => {} });
          return (result?.data?.text || "").trim();
        })();
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => resolve(""), 15000);
        });
        extractedText = await Promise.race([ocrPromise, timeoutPromise]);
      } catch (e) {
        extractedText = "";
      }
    } else {
      // Text file - read directly
      extractedText = buffer.toString("utf-8");
      // Clean chat log format
      let cleaned = extractedText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
      const wechatPattern = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([^\n]+)\n([^\n]+)/g;
      const testPattern = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
      if (testPattern.test(cleaned)) {
        cleaned = cleaned.replace(wechatPattern, "[$1] $2: $3");
      }
      extractedText = cleaned.trim();
    }

    // Cap extracted text length to prevent token abuse
    if (extractedText.length > MAX_TEXT_LENGTH) {
      extractedText = extractedText.substring(0, MAX_TEXT_LENGTH) + "\n...（内容过长，已截断）";
    }

    return apiResponse({ text: extractedText, needsOcr });
  } catch (error: any) {
    console.error("[Extract API] Error:", error.message);
    return apiError("服务器繁忙，请稍后重试", 500);
  }
}
