import { NextRequest } from "next/server";
import { getAgnesClient } from "@/lib/agnes/client";
import { AGNES_CONFIG, isAIEnabled } from "@/lib/agnes/config";
import { checkRateLimit } from "@/lib/agnes/rate-limit";
import { buildChatSystemPrompt } from "@/lib/agnes/prompts";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 5000;
const MAX_HISTORY_LENGTH = 20;
const MAX_MATERIALS_COUNT = 50;
const MAX_MATERIAL_NAME_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    if (!isAIEnabled()) {
      return Response.json(
        { success: false, error: "AI 对话功能未启用" },
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
    if (message.length > MAX_MESSAGE_LENGTH) {
      return Response.json({ success: false, error: "消息过长" }, { status: 400 });
    }

    // Validate and cap history
    const safeHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_LENGTH) : [];
    for (const h of safeHistory) {
      if (typeof h.content !== "string" || h.content.length > MAX_MESSAGE_LENGTH) {
        return Response.json({ success: false, error: "历史消息格式异常" }, { status: 400 });
      }
    }

    // Validate and cap materials
    const safeMaterials = Array.isArray(materials) ? materials.slice(0, MAX_MATERIALS_COUNT) : [];
    for (const m of safeMaterials) {
      if (m.originalName && m.originalName.length > MAX_MATERIAL_NAME_LENGTH) {
        m.originalName = m.originalName.substring(0, MAX_MATERIAL_NAME_LENGTH);
      }
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
    const contextText = (safeMaterials || [])
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
    // CRITICAL: Filter history roles — only allow "user" and "assistant"
    // Attackers can try to inject "system" or "developer" roles to override our system prompt
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(safeHistory.slice(-10).map(h => ({
        role: (h.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
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
            encoder.encode(`data: ${JSON.stringify({ error: "服务器繁忙，请稍后重试" })}\n\n`)
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
    console.error("[Chat API] Error:", error.message);
    return Response.json(
      { success: false, error: "服务器繁忙，请稍后重试" },
      { status: 500 }
    );
  }
}
