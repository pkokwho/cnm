"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Home, LayoutDashboard, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function NavBar() {
  const pathname = usePathname();
  const isWorkspace = pathname?.startsWith("/app");
  const { lang, toggleLang, t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Box className="h-4 w-4" />
          </div>
          <span className="text-base">EvidenceBox</span>
          <span className="text-xs font-normal text-muted">
            {lang === "zh" ? "证据盒" : "Evidence Box"}
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant={isWorkspace ? "ghost" : "secondary"}
              size="sm"
              className={cn(!isWorkspace && "bg-bg2")}
            >
              <Home className="mr-1 h-4 w-4" />
              {t("nav.home")}
            </Button>
          </Link>
          <Link href="/app">
            <Button
              variant={isWorkspace ? "secondary" : "default"}
              size="sm"
            >
              <LayoutDashboard className="mr-1 h-4 w-4" />
              {t("nav.workspace")}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="ml-1 min-w-[44px] gap-1"
            title={lang === "zh" ? "Switch to English" : "切换为中文"}
          >
            <Languages className="h-4 w-4" />
            {lang === "zh" ? "EN" : "中"}
          </Button>
        </nav>
      </div>
    </header>
  );
}
