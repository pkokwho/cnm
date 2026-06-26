"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Trash2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import * as clientStore from "@/lib/client-store";
import type { ChatMessage } from "@/lib/client-store";
import { useI18n } from "@/lib/i18n/context";

interface AIChatProps {
  caseId: string;
  materials: { originalName: string; extractedText: string }[];
}

export function AIChat({ caseId, materials }: AIChatProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history on mount
  useEffect(() => {
    const history = clientStore.getChatHistory(caseId);
    setMessages(history);
    setShowSuggestions(history.length === 0);
  }, [caseId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    setError(null);
    const userMsg: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    clientStore.saveChatMessage(caseId, userMsg);
    setInput("");
    setStreaming(true);
    setStreamingContent("");
    setShowSuggestions(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-10),
          materials,
        }),
      });

      if (response.status === 429) {
        throw new Error(t("chat.rateLimited"));
      }
      if (response.status === 503) {
        throw new Error(t("chat.error"));
      }
      if (!response.ok) throw new Error(t("chat.error"));

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
                if (parsed.error) throw new Error(parsed.error);
              } catch (e) {
                if (e instanceof SyntaxError) continue; // Ignore partial JSON
                throw e;
              }
            }
          }
        }

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: fullContent || "(空回复)",
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        clientStore.saveChatMessage(caseId, assistantMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || t("chat.error");
      setError(errMsg);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `抱歉，出现了错误：${errMsg}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
      clientStore.saveChatMessage(caseId, errorMsg);
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  }, [caseId, messages, streaming, materials, t]);

  const handleClear = () => {
    if (confirm(t("chat.clear.confirm"))) {
      clientStore.clearChatHistory(caseId);
      setMessages([]);
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const SUGGESTED_QUESTIONS = [
    "这个案件的核心问题是什么？",
    "有哪些需要注意的截止日期？",
    "我应该优先处理什么？",
    "材料中有哪些关键金额信息？",
  ];

  return (
    <div className="flex h-[60vh] max-h-[500px] min-h-[350px] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>AI 助手</span>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-9 text-xs text-muted"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            {t("chat.clear")}
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && !streaming && showSuggestions && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
              <MessageSquare className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm font-medium">{t("chat.empty")}</p>
            <p className="mt-1 text-xs text-muted">{t("chat.empty.desc")}</p>
            <div className="mt-4 w-full space-y-2">
              <p className="text-xs text-muted">{t("chat.suggested")}</p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="block w-full rounded-lg border border-border bg-bg2 px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:bg-accent-light"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-accent text-white rounded-br-sm"
                  : "bg-bg2 border border-border rounded-bl-sm"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-bg2 border border-border px-4 py-2.5 text-sm">
              {streamingContent ? (
                <p className="whitespace-pre-wrap break-words">{streamingContent}</p>
              ) : (
                <span className="flex items-center gap-1.5 text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("chat.sending")}
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.placeholder")}
          className="min-h-[44px] max-h-[120px] resize-none text-sm"
          rows={1}
          disabled={streaming}
        />
        <Button
          size="icon"
          onClick={() => sendMessage(input)}
          disabled={streaming || !input.trim()}
          className="h-[44px] w-[44px] shrink-0"
        >
          {streaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
