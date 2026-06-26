import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "EvidenceBox 证据盒 — 把混乱材料变成可执行方案",
  description:
    "上传聊天记录、截图、票据、录音等零散材料，系统自动整理为时间线、关键摘要、待办清单和下一步建议。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
