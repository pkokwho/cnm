import { NextRequest } from "next/server";
import { store } from "@/lib/store";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET() {
  try {
    const allCases = store.getCases();
    return apiResponse(allCases);
  } catch (error: any) {
    return apiError(`获取案件列表失败: ${error.message}`, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = body.title?.trim();

    if (!title) {
      return apiError("案件标题不能为空", 400);
    }

    const id = crypto.randomUUID();
    const newCase = store.createCase(id, title);
    return apiResponse(newCase);
  } catch (error: any) {
    return apiError(`创建案件失败: ${error.message}`, 500);
  }
}
