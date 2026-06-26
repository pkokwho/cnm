import { AGNES_CONFIG } from "./config";

/**
 * System prompt for AI-enhanced analysis.
 * Instructs the model to output strict JSON aligned with AnalysisResult type.
 */
export function buildAnalysisSystemPrompt(): string {
  return `你是一个专业的证据整理分析专家。用户上传了若干材料（聊天记录、截图OCR文本、PDF等），已提取为纯文本。
我会提供材料的原始文本，以及规则引擎预提取的结构化信息（日期、实体、分类）。

请基于这些材料生成结构化分析结果，输出**严格的 JSON**（不要包含 markdown 代码块标记），格式如下：

{
  "summary": {
    "oneLine": "一句话概括整个案件/材料包的核心情况（不超过100字）",
    "keyPoints": ["关键要点1", "关键要点2"],
    "keywords": ["关键词1", "关键词2"]
  },
  "timeline": [
    {
      "date": "材料中出现的原始日期文本",
      "normalizedDate": "YYYY-MM-DD 格式，无法解析则为 null",
      "title": "该日期发生的事件简述（不超过60字）",
      "description": "事件详细描述（不超过150字）",
      "sourceMaterialName": "来源材料文件名"
    }
  ],
  "todos": [
    {
      "text": "待办事项描述",
      "priority": "high|medium|low",
      "dueDate": "YYYY-MM-DD 格式的截止日期，无则为 null",
      "sourceMaterialName": "来源材料文件名"
    }
  ],
  "suggestions": [
    {
      "title": "建议标题",
      "rationale": "为什么给出这个建议（基于材料中的什么信息）",
      "action": "具体怎么做（可操作的步骤）",
      "priority": "high|medium|low"
    }
  ]
}

要求：
1. 时间线按日期先后排序，最多30条
2. 待办最多20条，按优先级排序
3. 建议最多8条，按优先级排序，基于材料实际内容而非通用模板
4. 所有文本用中文
5. 只输出 JSON，不要有任何其他文字`;
}

/**
 * User prompt for analysis — includes rule engine hints + material text.
 */
export function buildAnalysisUserPrompt(
  materials: { id: string; originalName: string; extractedText: string }[],
  ruleHints: {
    dates: { raw: string; normalized: string | null }[];
    entities: { phones: string[]; amounts: { raw: string }[]; people: string[] };
    categories: string[];
  }
): string {
  const limit = AGNES_CONFIG.limits.perMaterialCharLimit;

  const materialsText = materials.map((m, i) => {
    const truncated = m.extractedText.length > limit
      ? m.extractedText.substring(0, limit) + "\n...（内容过长，已截断）"
      : m.extractedText;
    return `【材料${i + 1}：${m.originalName}】\n${truncated}`;
  }).join("\n\n---\n\n");

  const hintsText = `【规则引擎预提取信息】
- 检测到的日期：${ruleHints.dates.map(d => `${d.raw}(${d.normalized || "未解析"})`).join("、") || "无"}
- 检测到的金额：${ruleHints.entities.amounts.map(a => a.raw).join("、") || "无"}
- 检测到的人物：${ruleHints.entities.people.join("、") || "无"}
- 材料分类：${ruleHints.categories.join("、") || "未分类"}`;

  return `${hintsText}\n\n【材料文本】\n${materialsText}`;
}

/**
 * System prompt for AI chat — includes material context.
 */
export function buildChatSystemPrompt(materialsContext: string): string {
  return `你是 EvidenceBox 证据盒的 AI 助手。用户上传了以下材料并提取了文本内容。你的任务是基于这些材料回答用户的问题。

【材料内容】
${materialsContext}

回答要求：
1. 优先基于材料内容回答，引用材料时注明来源文件名
2. 如果问题超出了材料范围，明确告知用户并说明原因
3. 回答用中文，条理清晰
4. 如果用户询问法律建议，提供一般性参考意见并建议咨询专业律师
5. 不要编造材料中不存在的信息`;
}
