"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Home, LayoutDashboard, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function NavBar() {
  const pathname = usePathname();
  const isWorkspace = pathname?.startsWith("/app");
  const isImageStudio = pathname?.startsWith("/app/image-studio");
  const isHome = !isWorkspace;
  const { lang, toggleLang, t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Box className="h-4 w-4" />
          </div>
          <span className="text-base">EvidenceBox</span>
          <span className="hidden text-xs font-normal text-muted sm:inline">
            {lang === "zh" ? "证据盒" : "Evidence Box"}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/">
            <Button
              variant={isHome ? "secondary" : "ghost"}
              size="sm"
              className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3"
              title={t("nav.home")}
            >
              <Home className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("nav.home")}</span>
            </Button>
          </Link>
          <Link href="/app">
            <Button
              variant={isWorkspace && !isImageStudio ? "secondary" : "ghost"}
              size="sm"
              className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3"
              title={t("nav.workspace")}
            >
              <LayoutDashboard className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("nav.workspace")}</span>
            </Button>
          </Link>
          <Link href="/app/image-studio">
            <Button
              variant={isImageStudio ? "secondary" : "default"}
              size="sm"
              className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3"
              title={t("nav.imageStudio")}
            >
              <Sparkles className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("nav.imageStudio")}</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="ml-1 h-9 min-w-[36px] gap-1 px-2"
            title={lang === "zh" ? "Switch to English" : "切换为中文"}
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs">{lang === "zh" ? "EN" : "中"}</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
