import { NextRequest } from "next/server";
import { getAgnesClient } from "@/lib/agnes/client";
import { AGNES_CONFIG, isAIEnabled } from "@/lib/agnes/config";
import { checkRateLimit } from "@/lib/agnes/rate-limit";
import { buildChatSystemPrompt } from "@/lib/agnes/prompts";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!isAIEnabled()) {
      return Response.json(
        { success: false, error: "AI 对话功能未启用（未配置 API Key）" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, history, materials } = body as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      materials: { originalName: string; extractedText: string }[];
    };

    if (!message?.trim()) {
      return Response.json({ success: false, error: "消息不能为空" }, { status: 400 });
    }

    // Rate limit check
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      return Response.json(
        { success: false, error: "请求过于频繁，请稍等片刻再试" },
        { status: 429 }
      );
    }

    // Build material context (truncate per material)
    const limit = AGNES_CONFIG.limits.chatPerMaterialCharLimit;
    const contextText = (materials || [])
      .filter(m => m.extractedText)
      .map(m => {
        const text = m.extractedText.length > limit
          ? m.extractedText.substring(0, limit) + "...（已截断）"
          : m.extractedText;
        return `【${m.originalName}】\n${text}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = buildChatSystemPrompt(contextText || "（用户尚未上传材料）");

    // Build messages (system + last 10 history + current message)
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...((history || []).slice(-10).map(h => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      }))),
      { role: "user" as const, content: message },
    ];

    const client = getAgnesClient();

    // Stream response via SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const completion = await client.chat.completions.create({
            model: AGNES_CONFIG.models.chat,
            messages,
            stream: true,
            temperature: 0.5,
            max_tokens: AGNES_CONFIG.limits.maxChatOutputTokens,
          });

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error: any) {
          console.error("[Agnes AI] Chat error:", error.message);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: `对话失败: ${error.message}` },
      { status: 500 }
    );
  }
}
