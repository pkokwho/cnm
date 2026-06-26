"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  Loader2,
  Download,
  Trash2,
  Clock,
  Key,
  X,
  CheckCircle2,
  Image as ImageIcon,
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
import * as imageStore from "@/lib/image-store";
import type { GeneratedImage } from "@/lib/image-store";

const SIZES = [
  { value: "1024x1024", labelKey: "image.size.square" as const, desc: "1024×1024" },
  { value: "1024x768", labelKey: "image.size.landscape" as const, desc: "1024×768" },
  { value: "768x1024", labelKey: "image.size.portrait" as const, desc: "768×1024" },
];

export function ImageStudio() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  // Rate limit state
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfterSec, setRetryAfterSec] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Developer mode
  const [devDialogOpen, setDevDialogOpen] = useState(false);
  const [devKeyInput, setDevKeyInput] = useState("");
  const [isDev, setIsDev] = useState(false);

  // Load state on mount
  useEffect(() => {
    setHistory(imageStore.getImages());
    const existingDevKey = getDeveloperKey();
    if (existingDevKey) {
      setIsDev(true);
      setDevKeyInput(existingDevKey);
    }
    checkRateLimit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    setRetryAfterSec(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRetryAfterSec((prev) => {
        if (prev <= 1) {
          setRateLimited(false);
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const checkRateLimit = useCallback(() => {
    if (isDev) {
      setRateLimited(false);
      return;
    }
    const check = imageStore.canGenerateImage();
    if (!check.allowed) {
      setRateLimited(true);
      startCountdown(Math.ceil(check.retryAfterMs / 1000));
    } else {
      setRateLimited(false);
    }
  }, [isDev, startCountdown]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    if (!isDev && rateLimited) return;

    setError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          deviceId: getDeviceId(),
          developerKey: isDev ? getDeveloperKey() || undefined : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        const retrySec = data.retryAfterSec || 600;
        setRateLimited(true);
        startCountdown(retrySec);
        setError(data.error);
        return;
      }

      if (!data.success) {
        setError(data.error);
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

      // Record client-side rate limit (skip for developers)
      if (!data.data.developer) {
        imageStore.recordClientImageGen();
        checkRateLimit();
      }

      // Save to history
      await imageStore.saveImage(newImage);
      setHistory(imageStore.getImages());

      // Async: fetch and cache image blob for persistence
      imageStore.fetchAndCacheImage(data.data.url, newImage.id).then(() => {
        setHistory(imageStore.getImages());
      });
    } catch (err: any) {
      setError(err.message || "图片生成失败");
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
      setRateLimited(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
    } else {
      checkRateLimit();
    }
  };

  const handleRemoveDevKey = () => {
    setDeveloperKey("");
    setIsDev(false);
    setDevKeyInput("");
    setDevDialogOpen(false);
    checkRateLimit();
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canGenerate = !generating && (!rateLimited || isDev) && prompt.trim().length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("image.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("image.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {isDev && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("image.dev.enabled")}
            </Badge>
          )}
          <Button
            variant={isDev ? "destructive" : "ghost"}
            size="sm"
            onClick={() => setDevDialogOpen(true)}
          >
            <Key className="mr-1 h-4 w-4" />
            {isDev ? t("image.dev.deactivate") : t("image.dev.title")}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("image.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("image.generate")}
                </>
              )}
            </Button>

            {rateLimited && !isDev && (
              <div className="flex items-center justify-center gap-2 text-sm text-warning">
                <Clock className="h-4 w-4" />
                <span>
                  {t("image.rateLimit.countdown")}: {formatCountdown(retryAfterSec)}
                </span>
              </div>
            )}

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div>
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-base">{t("image.result")}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentImage ? (
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
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(img);
                      }}
                      className="rounded bg-white/20 p-1 text-white hover:bg-white/30"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id);
                      }}
                      className="rounded bg-white/20 p-1 text-white hover:bg-white/30"
                    >
                      <Trash2 className="h-3 w-3" />
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
    </div>
  );
}
