"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, Image, FileType, CheckCircle, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/context";

interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function UploadDropzone({ caseId, onUploaded }: { caseId: string; onUploaded?: () => void }) {
  const { t } = useI18n();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileEntry: UploadedFile = { name: file.name, size: file.size, status: "uploading" };
      setFiles((prev) => [...prev, fileEntry]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caseId", caseId);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (data.success) {
          setFiles((prev) =>
            prev.map((f) => (f.name === file.name && f.size === file.size ? { ...f, status: "done" } : f))
          );
          onUploaded?.();
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name && f.size === file.size
                ? { ...f, status: "error", error: data.error }
                : f
            )
          );
        }
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.size === file.size
              ? { ...f, status: "error", error: err.message }
              : f
          )
        );
      }
    }
  }, [caseId, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/json": [".json"],
    },
    maxSize: 20 * 1024 * 1024,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragActive ? "border-accent bg-accent-light" : "border-border bg-bg2 hover:border-accent hover:bg-accent-light/50"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className={cn("mb-3 h-12 w-12", isDragActive ? "text-accent" : "text-muted")} />
        {isDragActive ? (
          <p className="text-sm font-medium text-accent">{t("upload.dragActive")}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">{t("upload.drag")}</p>
            <p className="mt-1 text-xs text-muted">{t("upload.supported")}</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
              <div className="flex-shrink-0">
                {f.name.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                  <Image className="h-5 w-5 text-blue-500" />
                ) : f.name.match(/\.pdf$/i) ? (
                  <FileType className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted">{formatBytes(f.size)}</p>
              </div>
              {f.status === "uploading" && (
                <div className="w-20">
                  <Progress value={50} className="h-1.5" />
                </div>
              )}
              {f.status === "done" && <CheckCircle className="h-5 w-5 text-green-500" />}
              {f.status === "error" && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-xs">{f.error || t("upload.failed")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
