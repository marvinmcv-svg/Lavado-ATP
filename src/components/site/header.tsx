"use client";
// Site header — sticky nav, bilingual toggle, admin access, mobile menu.
import { useEffect, useState } from "react";
import { Menu, X, Globe, Droplets, Shield } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_KEYS = [
  { key: "nav_services", href: "#services" },
  { key: "nav_beforeafter", href: "#before-after" },
  { key: "nav_reels", href: "#reels" },
  { key: "nav_quote", href: "#quote" },
  { key: "nav_area", href: "#area" },
  { key: "nav_reviews", href: "#reviews" },
] as const;

export function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // sync lang from localStorage on mount
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("lang") : null;
    if (stored === "es" || stored === "en") setLang(stored);
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [setLang]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2 group" aria-label="lavadoatp inicio">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md group-hover:scale-105 transition-transform">
            <Droplets className="size-5" />
          </span>
          <span className="font-extrabold text-lg tracking-tight">
            lavado<span className="text-primary">atp</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_KEYS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
            >
              {t(lang, item.key as never)}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Bilingual toggle */}
          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-bold hover:bg-accent/40 transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="size-3.5" />
            <span className={cn(lang === "es" && "text-primary")}>ES</span>
            <span className="text-muted-foreground/50">/</span>
            <span className={cn(lang === "en" && "text-primary")}>EN</span>
          </button>

          {/* Admin button */}
          <Button
            onClick={onAdminClick}
            variant="outline"
            size="sm"
            className="hidden sm:flex gap-1.5"
            aria-label={t(lang, "nav_admin")}
          >
            <Shield className="size-4" />
            <span className="hidden md:inline">{t(lang, "nav_admin")}</span>
          </Button>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-1 mt-6">
                {NAV_KEYS.map((item) => (
                  <SheetClose asChild key={item.key}>
                    <a
                      href={item.href}
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent/40"
                    >
                      {t(lang, item.key as never)}
                    </a>
                  </SheetClose>
                ))}
                <button
                  onClick={() => { onAdminClick(); }}
                  className="mt-2 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent/40"
                >
                  <Shield className="size-4" /> {t(lang, "nav_admin")}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
