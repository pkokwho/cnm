import { NextRequest } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Check case exists
        const caseData = store.getCase(id);
        if (!caseData) {
          sendEvent({ type: "error", message: "案件不存在" });
          controller.close();
          return;
        }

        // Send initial status
        sendEvent({
          type: "progress",
          stage: caseData.status,
          message: getStageMessage(caseData.status),
        });

        // Poll for status changes
        let lastStatus = caseData.status;
        let attempts = 0;
        const maxAttempts = 120; // 120 * 2s = 4 minutes max

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;

          const currentCase = store.getCase(id);
          if (!currentCase) break;

          if (currentCase.status !== lastStatus) {
            lastStatus = currentCase.status;
            sendEvent({
              type: "progress",
              stage: currentCase.status,
              message: getStageMessage(currentCase.status),
            });
          }

          if (currentCase.status === "ready") {
            // Send the result
            const result = store.getAnalysisResult(id);

            if (result) {
              sendEvent({
                type: "complete",
                result: {
                  timeline: JSON.parse(result.timeline),
                  summary: JSON.parse(result.summary),
                  todos: JSON.parse(result.todos),
                  suggestions: JSON.parse(result.suggestions),
                },
              });
            }
            break;
          }

          if (currentCase.status === "failed") {
            sendEvent({ type: "error", message: "分析失败" });
            break;
          }

          // Also send material progress
          const caseMaterials = store.getMaterialsByCaseId(id);
          const extracted = caseMaterials.filter(
            (m) => m.status === "extracted"
          ).length;
          const total = caseMaterials.length;
          sendEvent({
            type: "progress",
            stage: currentCase.status,
            materialProgress: { extracted, total },
            message: getStageMessage(currentCase.status),
          });
        }

        controller.close();
      } catch (error: any) {
        sendEvent({ type: "error", message: error.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function getStageMessage(status: string): string {
  const messages: Record<string, string> = {
    created: "案件已创建",
    uploading: "正在上传材料",
    extracting: "正在提取文本",
    analyzing: "正在分析材料",
    ready: "分析完成",
    failed: "分析失败",
  };
  return messages[status] || status;
}
