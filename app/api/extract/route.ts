import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("未找到文件", 400);

    const mimeType = file.type || "application/octet-stream";
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

    return apiResponse({ text: extractedText, needsOcr });
  } catch (error: any) {
    return apiError(`提取失败: ${error.message}`, 500);
  }
}
