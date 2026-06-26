import { Suggestion, TodoItem } from "./types";

export function generateSuggestions(
  categories: string[],
  amounts: { value: number; currency: string; raw: string }[],
  todos: TodoItem[],
  hasChatLogs: boolean
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Contract-related suggestion
  if (categories.includes("contract")) {
    suggestions.push({
      title: "审阅合同条款",
      rationale: "检测到合同/协议类材料，合同条款中的违约责任、争议解决方式直接影响维权效果",
      action: "仔细阅读合同全文，重点关注违约责任条款、争议解决条款（仲裁还是诉讼）、合同期限与解除条件",
      priority: "high",
    });
  }

  // Receipt-related suggestion
  if (categories.includes("receipt")) {
    suggestions.push({
      title: "核对票据金额",
      rationale: "检测到票据/发票类材料，金额核对是维权和报销的关键环节",
      action: "按时间顺序整理所有票据，逐笔核对金额合计是否一致，拍照留存原件",
      priority: "medium",
    });
  }

  // Large amount suggestion
  const largeAmounts = amounts.filter((a) => a.value > 10000);
  if (largeAmounts.length > 0) {
    suggestions.push({
      title: "核实大额交易",
      rationale: `检测到${largeAmounts.length}笔大额交易（超过1万元），大额交易需留存完整凭证`,
      action: "核实每笔大额交易的转账记录、收据或合同，确保金额、日期、对方信息完整对应",
      priority: "high",
    });
  }

  // Chat log preservation
  if (hasChatLogs) {
    suggestions.push({
      title: "保存聊天记录证据",
      rationale: "检测到聊天记录类材料，聊天记录是重要的电子证据，但容易被删除或篡改",
      action: "对关键聊天记录进行截图保存（含对方头像、昵称、时间），必要时可申请公证保全",
      priority: "medium",
    });
  }

  // High priority todos
  const highPriorityTodos = todos.filter((t) => t.priority === "high");
  if (highPriorityTodos.length > 0) {
    suggestions.push({
      title: "优先处理紧急事项",
      rationale: `检测到${highPriorityTodos.length}项高优先级待办，紧急事项可能涉及期限限制`,
      action: "按待办清单中的高优先级项逐一处理，特别关注含截止日期的事项，避免逾期",
      priority: "high",
    });
  }

  // Notice-related suggestion
  if (categories.includes("notice")) {
    suggestions.push({
      title: "关注通知要求",
      rationale: "检测到通知/公告类材料，通知中可能包含重要的截止日期或办理要求",
      action: "仔细阅读通知全文，标注关键日期和所需材料，确保在规定期限内完成相关手续",
      priority: "medium",
    });
  }

  // General backup suggestion (always include)
  suggestions.push({
    title: "导出备份材料",
    rationale: "整理好的材料应形成完整的备份，方便后续查阅、提交或分享",
    action: "使用导出功能将时间线、摘要、待办和建议导出为 Markdown 文件，妥善保存",
    priority: "low",
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}
