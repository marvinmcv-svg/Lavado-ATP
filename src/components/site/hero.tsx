"use client";
// Hero (Step 3.1) — mobile uses video (if set), desktop uses image.
// Headline + CTA from settings, WhatsApp CTA above the fold, trust stats.
import { Droplets, Star, Clock, Zap, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import type { Business, SiteSettings, Review } from "@/lib/types";

export function Hero({
  business,
  settings,
  reviews,
  heroImage,
}: {
  business: Business;
  settings: SiteSettings | null;
  reviews: Review[];
  heroImage: string | null;
}) {
  const lang = useLang((s) => s.lang);
  const phone = business.phone;
  const headline = lang === "en" ? settings?.heroHeadlineEn : settings?.heroHeadlineEs;
  const sub = lang === "en" ? settings?.heroSubheadlineEn : settings?.heroSubheadlineEs;
  const cta = lang === "en" ? settings?.ctaTextEn : settings?.ctaTextEs;
  const greeting = lang === "en" ? settings?.whatsappGreetingEn : settings?.whatsappGreetingEs;

  // Mobile hero video (admin-configurable). Desktop keeps the image.
  const heroVideoUrl = settings?.heroVideoUrl ?? null;
  const heroVideoPoster = settings?.heroVideoPosterUrl ?? heroImage;
  const desktopImage = settings?.heroImageUrl ?? heroImage;

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.starRating, 0) / reviews.length : 5;

  const onCta = () => {
    if (!phone) return;
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventType: "whatsapp_click", metadata: { source: "hero_cta" } }) }).catch(() => {});
    fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source: "whatsapp_widget", message: "Clicked hero CTA" }) }).catch(() => {});
  };

  return (
    <section id="top" className="relative isolate overflow-hidden">
      {/* Background media */}
      <div className="absolute inset-0 -z-10">
        {/* Mobile: video (if set) */}
        {heroVideoUrl && (
          <video
            className="absolute inset-0 size-full object-cover md:hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroVideoPoster ?? undefined}
            aria-hidden="true"
          >
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        )}
        {/* Desktop: image (or video if no image set) */}
        {desktopImage ? (
          <img
            src={desktopImage}
            alt=""
            className={`size-full object-cover ${heroVideoUrl ? "hidden md:block" : ""}`}
            fetchPriority="high"
          />
        ) : heroVideoUrl ? null : (
          <div className="size-full bg-water-texture bg-primary">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />
          </div>
        )}
        {/* Overlays — lighter on mobile so video is clearly visible, darker on desktop for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 md:bg-gradient-to-br md:from-primary/85 md:via-primary/55 md:to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:block hidden" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-16 pb-10 sm:pt-28 sm:pb-24 lg:pt-36 lg:pb-32 min-h-[88vh] flex flex-col justify-end sm:justify-center">
        <div className="max-w-3xl animate-fade-up">
          {/* Badge — hidden on mobile to save space for video */}
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-1.5 text-xs font-medium text-white mb-6">
            <span className="flex size-2 rounded-full bg-accent animate-pulse" />
            {lang === "en" ? "Professional pressure washing · Santa Cruz, Bolivia" : "Lavado a presión profesional · Santa Cruz, Bolivia"}
          </div>

          {/* Headline — smaller on mobile so video is visible */}
          <h1 className="text-2xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] sm:leading-[1.05] tracking-tight drop-shadow-lg">
            {headline}
          </h1>

          {/* Subheadline — hidden on mobile, shown on sm+ */}
          <p className="hidden sm:block mt-5 text-lg lg:text-xl text-white/90 max-w-2xl leading-relaxed drop-shadow">
            {sub}
          </p>

          {/* CTAs */}
          <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3">
            {phone ? (
              <a
                href={buildWhatsAppUrl(normalizePhone(phone), greeting ?? "")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onCta}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-bold shadow-xl hover:bg-accent/90 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Droplets className="size-4 sm:size-5" />
                {cta}
              </a>
            ) : (
              <a href="#quote" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-bold shadow-xl hover:bg-accent/90 transition-all">
                {lang === "en" ? "Request a quote" : "Solicitar cotización"}
              </a>
            )}
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold hover:bg-white/20 transition-all"
            >
              {lang === "en" ? "View services" : "Ver servicios"}
            </a>
          </div>

          {/* Trust stats — hidden on mobile, shown on sm+ */}
          <div className="hidden sm:grid mt-12 grid-cols-3 gap-4 sm:gap-8 max-w-2xl">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-accent">
                <Zap className="size-5" />
                <span className="text-2xl sm:text-3xl font-black text-white">500+</span>
              </div>
              <span className="text-xs sm:text-sm text-white/75 mt-1">
                {lang === "en" ? "Jobs completed" : "Trabajos realizados"}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-accent">
                <Star className="size-5 fill-accent" />
                <span className="text-2xl sm:text-3xl font-black text-white">{avgRating.toFixed(1)}</span>
              </div>
              <span className="text-xs sm:text-sm text-white/75 mt-1">
                {lang === "en" ? "Avg rating" : "Calificación promedio"}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-accent">
                <Clock className="size-5" />
                <span className="text-2xl sm:text-3xl font-black text-white">&lt;15m</span>
              </div>
              <span className="text-xs sm:text-sm text-white/75 mt-1">
                {lang === "en" ? "Response time" : "Tiempo de respuesta"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#services"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors hidden sm:flex flex-col items-center gap-1"
        aria-label="Scroll"
      >
        <ChevronDown className="size-6 animate-bounce" />
      </a>
    </section>
  );
}
