"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  Download,
  Trash2,
  Key,
  CheckCircle2,
  Image as ImageIcon,
  Coins,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/context";
import { getDeviceId, getDeveloperKey, setDeveloperKey } from "@/lib/device";
import { getApiHeaders } from "@/lib/request-token";
import * as imageStore from "@/lib/image-store";
import type { GeneratedImage } from "@/lib/image-store";

const SIZES = [
  { value: "1024x1024", labelKey: "image.size.square" as const, desc: "1024×1024" },
  { value: "1024x768", labelKey: "image.size.landscape" as const, desc: "1024×768" },
  { value: "768x1024", labelKey: "image.size.portrait" as const, desc: "768×1024" },
];

// Animated loading phrases that cycle during generation
const LOADING_PHRASES = [
  "正在理解你的创意...",
  "调色板上混合色彩...",
  "勾勒轮廓与光影...",
  "渲染高清细节...",
  "最后润色中...",
];

export function ImageStudio() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  // Credits
  const [credits, setCredits] = useState({ remaining: 3, limit: 3 });

  // Developer mode
  const [devDialogOpen, setDevDialogOpen] = useState(false);
  const [devKeyInput, setDevKeyInput] = useState("");
  const [isDev, setIsDev] = useState(false);

  // Loading animation state
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const phraseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load state on mount
  useEffect(() => {
    setHistory(imageStore.getImages());
    const existingDevKey = getDeveloperKey();
    if (existingDevKey) {
      setIsDev(true);
      setDevKeyInput(existingDevKey);
    }
    if (!existingDevKey) {
      setCredits(imageStore.getRemainingCredits());
    }
  }, []);

  // Cycle loading phrases during generation
  useEffect(() => {
    if (generating) {
      setLoadingPhraseIndex(0);
      phraseTimerRef.current = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2500);
    } else {
      if (phraseTimerRef.current) {
        clearInterval(phraseTimerRef.current);
        phraseTimerRef.current = null;
      }
    }
    return () => {
      if (phraseTimerRef.current) clearInterval(phraseTimerRef.current);
    };
  }, [generating]);

  const refreshCredits = useCallback(() => {
    if (!isDev) {
      setCredits(imageStore.getRemainingCredits());
    }
  }, [isDev]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    if (!isDev && credits.remaining <= 0) return;

    setError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          deviceId: getDeviceId(),
          developerKey: isDev ? getDeveloperKey() || undefined : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError(data.error || "今日生成次数已用完，请明天再来");
        setCredits({ remaining: 0, limit: data.limit || 3 });
        return;
      }

      if (!data.success) {
        // All failures show "服务器繁忙"
        setError(data.error || "服务器繁忙，请稍后重试");
        return;
      }

      const newImage: GeneratedImage = {
        id: imageStore.generateImageId(),
        prompt: data.data.prompt,
        size: data.data.size,
        url: data.data.url,
        timestamp: Date.now(),
        cached: false,
      };

      setCurrentImage(newImage);

      // Consume client-side credit (skip for developers)
      if (!data.data.developer) {
        imageStore.consumeClientCredit();
        // Use server-returned remaining if available, otherwise recompute
        if (data.data.remaining >= 0) {
          setCredits((prev) => ({ ...prev, remaining: data.data.remaining }));
        } else {
          refreshCredits();
        }
      }

      // Save to history
      await imageStore.saveImage(newImage);
      setHistory(imageStore.getImages());

      // Async: fetch and cache image blob for persistence
      imageStore.fetchAndCacheImage(data.data.url, newImage.id).then(() => {
        setHistory(imageStore.getImages());
      });
    } catch {
      setError("服务器繁忙，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (img: GeneratedImage) => {
    try {
      const blobUrl = await imageStore.getImageBlobUrl(img.id);
      const downloadUrl = blobUrl || img.url;

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `evidencebox-${img.id}.png`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (blobUrl) setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      setError("下载失败");
    }
  };

  const handleDelete = async (id: string) => {
    await imageStore.deleteImage(id);
    setHistory(imageStore.getImages());
    if (currentImage?.id === id) setCurrentImage(null);
  };

  const handleSaveDevKey = () => {
    setDeveloperKey(devKeyInput.trim());
    const activated = !!devKeyInput.trim();
    setIsDev(activated);
    setDevDialogOpen(false);
    if (activated) {
      // Developer has unlimited credits
      setCredits({ remaining: 999, limit: 999 });
    } else {
      refreshCredits();
    }
  };

  const handleRemoveDevKey = () => {
    setDeveloperKey("");
    setIsDev(false);
    setDevKeyInput("");
    setDevDialogOpen(false);
    refreshCredits();
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const noCredits = !isDev && credits.remaining <= 0;
  const canGenerate = !generating && !noCredits && prompt.trim().length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t("image.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("image.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Credits display */}
          {!isDev ? (
            <Badge variant={credits.remaining > 0 ? "default" : "secondary"} className="gap-1">
              <Coins className="h-3 w-3" />
              {credits.remaining} / {credits.limit}
            </Badge>
          ) : (
            <Badge variant="default" className="bg-green-600 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t("image.dev.enabled")}
            </Badge>
          )}
          <Button
            variant={isDev ? "destructive" : "ghost"}
            size="sm"
            onClick={() => setDevDialogOpen(true)}
            className="h-9"
          >
            <Key className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">{isDev ? t("image.dev.deactivate") : t("image.dev.title")}</span>
            <span className="sm:hidden">{isDev ? "退出" : "开发者"}</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("image.prompt.label")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("image.prompt.placeholder")}
                className="min-h-[120px]"
                maxLength={2000}
              />
              <p className="text-xs text-muted">{t("image.prompt.hint")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("image.size.label")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSize(s.value)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      size === s.value
                        ? "border-accent bg-accent-light"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="text-sm font-medium">{t(s.labelKey)}</div>
                    <div className="mt-1 text-xs text-muted">{s.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate button */}
          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              {generating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  {t("image.generating")}
                </>
              ) : noCredits ? (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  {t("image.noCredits")}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {t("image.generate")} ({credits.remaining})
                </>
              )}
            </Button>

            {noCredits && !isDev && (
              <p className="text-center text-sm text-muted">
                {t("image.creditsReset")}
              </p>
            )}

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>

        {/* Right: Result / Loading Animation */}
        <div>
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-base">{t("image.result")}</CardTitle>
            </CardHeader>
            <CardContent>
              {generating ? (
                /* ===== High-end loading animation ===== */
                <div className="flex h-[300px] flex-col items-center justify-center">
                  {/* Animated gradient orb */}
                  <div className="relative mb-6 h-24 w-24">
                    {/* Outer rotating ring */}
                    <div
                      className="absolute inset-0 rounded-full border-2 border-transparent"
                      style={{
                        borderTopColor: "var(--accent)",
                        borderRightColor: "var(--accent)",
                        animation: "spin 1.2s linear infinite",
                      }}
                    />
                    {/* Inner pulsing core */}
                    <div
                      className="absolute inset-3 rounded-full bg-gradient-to-br from-accent to-purple-500 opacity-80"
                      style={{
                        animation: "pulse-scale 1.5s ease-in-out infinite",
                      }}
                    />
                    {/* Sparkle icon in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles
                        className="h-8 w-8 text-white"
                        style={{ animation: "fade-flicker 2s ease-in-out infinite" }}
                      />
                    </div>
                    {/* Orbiting dots */}
                    <div
                      className="absolute inset-0"
                      style={{ animation: "spin 3s linear infinite reverse" }}
                    >
                      <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-accent" />
                      <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-purple-400" />
                    </div>
                  </div>

                  {/* Cycling loading phrases */}
                  <div className="h-6 overflow-hidden">
                    <p
                      key={loadingPhraseIndex}
                      className="text-sm font-medium text-accent"
                      style={{ animation: "fade-slide-up 0.5s ease-out" }}
                    >
                      {LOADING_PHRASES[loadingPhraseIndex]}
                    </p>
                  </div>

                  {/* Progress shimmer bar */}
                  <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-bg2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent via-purple-400 to-accent"
                      style={{
                        width: "40%",
                        animation: "shimmer-slide 1.8s ease-in-out infinite",
                      }}
                    />
                  </div>
                </div>
              ) : currentImage ? (
                /* ===== Result display ===== */
                <div className="space-y-4">
                  <div className="flex justify-center rounded-lg border border-border bg-bg2 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImage.url}
                      alt={currentImage.prompt}
                      className="max-h-[300px] max-w-full rounded object-contain"
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted">Prompt:</span> {currentImage.prompt}</p>
                    <p><span className="text-muted">尺寸:</span> {currentImage.size}</p>
                    <p><span className="text-muted">时间:</span> {formatTime(currentImage.timestamp)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(currentImage)}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {t("image.download")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleDelete(currentImage.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {t("image.delete")}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ===== Empty state ===== */
                <div className="flex h-[300px] flex-col items-center justify-center text-muted">
                  <ImageIcon className="mb-2 h-12 w-12 opacity-50" />
                  <p className="text-sm">{t("image.noResult")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Gallery */}
      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold">{t("image.history")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {history.map((img) => (
              <div
                key={img.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-border"
                onClick={() => setCurrentImage(img)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.prompt}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(img);
                      }}
                      className="rounded bg-white/20 p-2 text-white hover:bg-white/30"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id);
                      }}
                      className="rounded bg-white/20 p-2 text-white hover:bg-white/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="line-clamp-2 text-xs text-white">{img.prompt}</p>
                </div>
                {img.cached && (
                  <Badge variant="success" className="absolute left-1 top-1 text-[10px]">
                    {t("image.cached")}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Developer Mode Dialog */}
      <Dialog open={devDialogOpen} onOpenChange={setDevDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("image.dev.title")}</DialogTitle>
            <DialogDescription>{t("image.dev.desc")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="dev-key">{t("image.dev.keyLabel")}</Label>
            <Input
              id="dev-key"
              type="password"
              value={devKeyInput}
              onChange={(e) => setDevKeyInput(e.target.value)}
              placeholder={t("image.dev.keyPlaceholder")}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            {isDev && (
              <Button variant="destructive" onClick={handleRemoveDevKey}>
                {t("image.dev.deactivate")}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setDevDialogOpen(false)}>
              {t("cases.dialog.cancel")}
            </Button>
            <Button onClick={handleSaveDevKey} disabled={!devKeyInput.trim()}>
              {t("image.dev.activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes fade-flicker {
          0%, 100% { opacity: 0.7; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  );
}
