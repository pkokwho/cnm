const CATEGORY_KEYWORDS: Record<string, string[]> = {
  chat: [
    "微信", "QQ", "发送", "消息", "语音", "聊天", "通话", "撤回",
    "表情", "红包", "转账", "群聊", "私信", "已读", "未读",
  ],
  receipt: [
    "发票", "收据", "金额", "合计", "小计", "盖章", "报销", "收银",
    "凭证", "票据", "消费", "付款", "刷卡", "账单", "明细",
  ],
  contract: [
    "合同", "协议", "甲方", "乙方", "违约", "签字", "条款", "约定",
    "租赁", "买卖", "服务期", "解约", "终止", "生效", "履行",
  ],
  notice: [
    "通知", "公告", "须知", "关于", "特此", "决定", "规定", "办法",
    "条例", "意见", "说明", "告示", "声明", "公示",
  ],
};

export function categorize(text: string): string {
  if (!text || text.trim().length === 0) return "other";

  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let count = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, "gi");
      const matches = text.match(regex);
      if (matches) count += matches.length;
    }
    scores[category] = count;
  }

  let bestCategory = "other";
  let bestScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore > 0 ? bestCategory : "other";
}
