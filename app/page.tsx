"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Calendar, FileText, CheckSquare, Rocket,
  Upload, Cpu, ClipboardCheck,
  GraduationCap, Briefcase, Home,
  Clock, AlertCircle, XCircle, HelpCircle,
  Zap, Leaf, ArrowRight, Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/nav-bar";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { t, lang } = useI18n();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [lang]);

  const features = [
    { icon: Calendar, color: "bg-accent-light text-accent", title: t("features.timeline.title"), desc: t("features.timeline.desc") },
    { icon: FileText, color: "bg-accent2-light text-accent2", title: t("features.summary.title"), desc: t("features.summary.desc") },
    { icon: CheckSquare, color: "bg-amber-100 text-amber-600", title: t("features.todos.title"), desc: t("features.todos.desc") },
    { icon: Rocket, color: "bg-pink-100 text-pink-600", title: t("features.suggestions.title"), desc: t("features.suggestions.desc") },
  ];

  const steps = [
    { num: "1", icon: Upload, title: t("how.step1.title"), desc: t("how.step1.desc") },
    { num: "2", icon: Cpu, title: t("how.step2.title"), desc: t("how.step2.desc") },
    { num: "3", icon: ClipboardCheck, title: t("how.step3.title"), desc: t("how.step3.desc") },
  ];

  const userGroups = [
    { tag: t("users.student.tag"), icon: GraduationCap, title: t("users.student.title"), items: [t("users.student.1"), t("users.student.2"), t("users.student.3")] },
    { tag: t("users.worker.tag"), icon: Briefcase, title: t("users.worker.title"), items: [t("users.worker.1"), t("users.worker.2"), t("users.worker.3")] },
    { tag: t("users.family.tag"), icon: Home, title: t("users.family.title"), items: [t("users.family.1"), t("users.family.2"), t("users.family.3")] },
  ];

  const painPoints = [
    { icon: HelpCircle, title: t("pain.find.title"), desc: t("pain.find.desc") },
    { icon: Clock, title: t("pain.time.title"), desc: t("pain.time.desc") },
    { icon: XCircle, title: t("pain.miss.title"), desc: t("pain.miss.desc") },
    { icon: AlertCircle, title: t("pain.act.title"), desc: t("pain.act.desc") },
  ];

  const efficiencyItems: TranslationKey[] = ["value.efficiency.1", "value.efficiency.2", "value.efficiency.3", "value.efficiency.4"];
  const socialItems: TranslationKey[] = ["value.social.1", "value.social.2", "value.social.3", "value.social.4"];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden text-center">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "url('/hero_concept_1280x720.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(2px)",
          }}
        />
        <div className="relative z-10 max-w-[800px] px-4 py-20">
          <span className="inline-block rounded-full bg-accent-light px-4 py-1.5 text-sm font-semibold text-accent">
            {t("hero.badge")}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 text-xl text-muted md:text-2xl">
            {t("hero.subtitle")}
          </p>
          <p className="mx-auto mt-6 max-w-[600px] text-muted">
            {t("hero.desc1")}<strong className="text-foreground">{t("hero.desc2")}</strong>{t("hero.desc3")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/app">
              <Button size="lg">
                {t("hero.cta.enter")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary">{t("hero.cta.learn")}</Button>
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-sm text-muted">
          {t("hero.scroll")}
        </div>
      </section>

      {/* Problem */}
      <section className="py-20">
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="mb-14 text-center reveal">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">{t("problem.tag")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("problem.title")}</h2>
            <p className="mx-auto mt-3 max-w-[600px] text-muted">
              {t("problem.desc")}
            </p>
          </div>

          <div className="reveal rounded-lg border-l-4 border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 p-6 md:p-8">
            <p className="text-base md:text-lg">
              <strong className="text-amber-800">{t("problem.insight")}</strong>
              {t("problem.insight.desc")}
            </p>
          </div>

          <div className="mt-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/user_scene_1024x576.jpg"
              alt={t("problem.imgCaption")}
              className="mx-auto rounded-lg border border-border shadow-lg"
              style={{ maxHeight: "420px", width: "auto" }}
            />
            <p className="mt-3 text-sm text-muted">{t("problem.imgCaption")}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-bg2 py-20">
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="mb-14 text-center reveal">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">{t("features.tag")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("features.title")}</h2>
            <p className="mx-auto mt-3 max-w-[600px] text-muted">
              {t("features.desc")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="reveal group relative overflow-hidden rounded-lg border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: f.color.includes("accent-light") ? "var(--color-accent-light)" : f.color.includes("accent2") ? "var(--color-accent2-light)" : undefined }}>
                  <f.icon className={`h-6 w-6 ${f.color.split(" ")[1]}`} />
                </div>
                <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="mb-14 text-center reveal">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">{t("how.tag")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("how.title")}</h2>
            <p className="mx-auto mt-3 max-w-[500px] text-muted">{t("how.desc")}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {steps.map((s, i) => (
              <div key={i} className="reveal relative max-w-[320px] flex-1 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-indigo-600 text-xl font-bold text-white shadow-md">
                  {s.num}
                </div>
                <s.icon className="mx-auto mb-3 h-8 w-8 text-accent" />
                <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Users */}
      <section className="bg-bg2 py-20">
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="mb-14 text-center reveal">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">{t("users.tag")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("users.title")}</h2>
            <p className="mx-auto mt-3 max-w-[600px] text-muted">{t("users.desc")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {userGroups.map((p, i) => (
              <div key={i} className="reveal rounded-lg border border-border bg-background p-6 shadow-sm">
                <span className="inline-block rounded bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">{p.tag}</span>
                <h3 className="mb-3 mt-2 flex items-center gap-2 text-lg font-bold">
                  <p.icon className="h-5 w-5" />
                  {p.title}
                </h3>
                <ul className="space-y-1.5">
                  {p.items.map((item, j) => (
                    <li key={j} className="pl-4 text-sm text-muted relative before:absolute before:left-0 before:text-accent before:font-bold before:content-['•']">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h3 className="mb-6 text-center text-lg font-bold">{t("pain.title")}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {painPoints.map((p, i) => (
                <div key={i} className="reveal flex gap-3 rounded-lg border border-border bg-background p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{p.title}</h4>
                    <p className="text-xs text-muted">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="py-20">
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="mb-14 text-center reveal">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">{t("value.tag")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("value.title")}</h2>
            <p className="mx-auto mt-3 max-w-[600px] text-muted">{t("value.desc")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="reveal rounded-lg border border-accent-light bg-gradient-to-br from-blue-50 to-white p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Zap className="h-5 w-5 text-accent" />
                {t("value.efficiency.title")}
              </h3>
              <ul className="space-y-2">
                {efficiencyItems.map((key, i) => (
                  <li key={i} className="pl-6 relative before:absolute before:left-0 before:text-accent2 before:font-bold before:content-['✓']">
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal rounded-lg border border-accent2-light bg-gradient-to-br from-green-50 to-white p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Leaf className="h-5 w-5 text-accent2" />
                {t("value.social.title")}
              </h3>
              <ul className="space-y-2">
                {socialItems.map((key, i) => (
                  <li key={i} className="pl-6 relative before:absolute before:left-0 before:text-accent2 before:font-bold before:content-['✓']">
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="bg-foreground py-20 text-center text-white">
        <div className="mx-auto max-w-[800px] px-4">
          <blockquote className="reveal text-xl font-semibold italic leading-relaxed md:text-2xl">
            {t("manifesto.1")}<span className="text-accent">{t("manifesto.2")}</span>{t("manifesto.3")}<br />
            {t("manifesto.4")}<span className="text-accent">{t("manifesto.5")}</span>{t("manifesto.6")}
          </blockquote>
          <p className="reveal mt-6 text-slate-400">{t("manifesto.author")}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-bg2 to-white py-20 text-center">
        <div className="mx-auto max-w-[500px] px-4">
          <h2 className="reveal text-2xl font-bold md:text-3xl">{t("cta.title")}</h2>
          <p className="reveal mt-4 text-muted">{t("cta.desc")}</p>
          <div className="reveal mt-8">
            <Link href="/app">
              <Button size="lg">
                <Box className="mr-2 h-5 w-5" />
                {t("cta.button")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        <p>{t("footer")}</p>
      </footer>
    </div>
  );
}
