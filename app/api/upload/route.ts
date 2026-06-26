import { NextRequest } from "next/server";
import { store } from "@/lib/store";
import { apiResponse, apiError } from "@/lib/utils";

export const maxDuration = 60;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/webp": "image",
  "image/gif": "image",
  "application/pdf": "pdf",
  "text/plain": "text",
  "text/csv": "text",
  "application/json": "text",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function getExtFromName(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/json": "json",
  };
  return map[mime] || "bin";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caseId = formData.get("caseId") as string | null;

    if (!file) {
      return apiError("未找到文件", 400);
    }
    if (!caseId) {
      return apiError("缺少案件ID", 400);
    }

    const mimeType = file.type || "application/octet-stream";
    const category = ALLOWED_MIME_TYPES[mimeType];

    if (!category) {
      return apiError(`不支持的文件类型: ${mimeType}`, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("文件大小超过限制（最大20MB）", 400);
    }

    // Verify case exists
    const caseData = store.getCase(caseId);
    if (!caseData) {
      return apiError("案件不存在", 400);
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = getExtFromName(file.name) || getExtFromMime(mimeType);

    // Save file via the store (disk in SQLite mode, memory in Vercel mode)
    const storageKey = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;
    store.saveFile(storageKey, buffer);

    // Create material record
    const materialId = crypto.randomUUID();
    const material = store.createMaterial({
      id: materialId,
      caseId,
      originalName: file.name,
      storageKey,
      mimeType,
      sizeBytes: file.size,
      category,
      status: "uploaded",
      extractedText: null,
      extractedMeta: null,
      errorMsg: null,
    });

    // Update case status
    store.updateCaseStatus(caseId, "uploading");

    return apiResponse(material);
  } catch (error: any) {
    return apiError(`上传文件失败: ${error.message}`, 500);
  }
}
