export function processText(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export function cleanChatLog(text: string): string {
  // Try to clean up common chat log formats
  // Remove excessive whitespace
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

  // Try to detect and format WeChat-style logs
  // Pattern: "昵称 时间" or "时间 昵称" followed by message
  // Use a fresh regex for test to avoid lastIndex issues with global flag
  const wechatPattern = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([^\n]+)\n([^\n]+)/g;
  const testPattern = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
  if (testPattern.test(cleaned)) {
    cleaned = cleaned.replace(wechatPattern, "[$1] $2: $3");
  }

  return cleaned.trim();
}
