"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Clock, Trash2, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

interface CaseData {
  id: string;
  title: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export default function WorkspaceHome() {
  const { t } = useI18n();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    created: { label: t("status.created"), variant: "secondary" },
    uploading: { label: t("status.uploading"), variant: "warning" },
    extracting: { label: t("status.extracting"), variant: "warning" },
    analyzing: { label: t("status.analyzing"), variant: "warning" },
    ready: { label: t("status.ready"), variant: "success" },
    failed: { label: t("status.failed"), variant: "destructive" },
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cases");
        const data = await res.json();
        if (!cancelled && data.success) {
          setCases(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle("");
        setDialogOpen(false);
        const res2 = await fetch("/api/cases");
        const data2 = await res2.json();
        if (data2.success) setCases(data2.data);
      }
    } catch (err) {
      console.error("Failed to create case:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/cases/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      const res = await fetch("/api/cases");
      const data = await res.json();
      if (data.success) setCases(data.data);
    } catch (err) {
      console.error("Failed to delete case:", err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("cases.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("cases.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("cases.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("cases.dialog.title")}</DialogTitle>
              <DialogDescription>{t("cases.dialog.desc")}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="title">{t("cases.dialog.label")}</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("cases.dialog.placeholder")}
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creating) handleCreate();
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>{t("cases.dialog.cancel")}</Button>
              <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                {creating ? t("cases.dialog.creating") : t("cases.dialog.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-bg2" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
              <Box className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold">{t("cases.empty.title")}</h3>
            <p className="mt-2 text-sm text-muted">{t("cases.empty.desc")}</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("cases.empty.cta")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => {
            const status = STATUS_MAP[c.status] || { label: c.status, variant: "secondary" as const };
            return (
              <Card
                key={c.id}
                className="group relative cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FolderOpen className="h-8 w-8 text-accent" />
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <CardTitle className="mt-2 truncate">{c.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {formatTime(c.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/app/cases/${c.id}`}>
                      <Button variant="secondary" size="sm">{t("cases.open")}</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteConfirm(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cases.delete.title")}</DialogTitle>
            <DialogDescription>{t("cases.delete.desc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{t("cases.dialog.cancel")}</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              {t("cases.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
