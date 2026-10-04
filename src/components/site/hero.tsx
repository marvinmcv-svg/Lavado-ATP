"use client";
// Hero — premium version with VIDEO ON ALL DEVICES (desktop + mobile),
// before/after swipe reveal effect, parallax, floating particles,
// animated text reveal, glow CTAs, and count-up stats.
import { useEffect, useRef, useState } from "react";
import { Droplets, Star, Clock, Zap, ChevronDown, Sparkles, MoveHorizontal } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import { useCountUp } from "@/hooks/use-reveal";
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

  const heroVideoUrl = settings?.heroVideoUrl ?? null;
  const heroVideoPoster = settings?.heroVideoPosterUrl ?? heroImage;
  // "Before" image for the swipe effect — use the first before/after pair's "before" photo
  const beforeImage = settings?.heroImageUrl ?? heroImage;
  // "After" image — the video poster or hero image
  const afterImage = heroVideoPoster ?? heroImage;

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.starRating, 0) / reviews.length : 5;

  // Parallax scroll
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Before/After swipe state — animated auto-reveal on desktop
  const [swipePos, setSwipePos] = useState(50);
  const [autoSwipe, setAutoSwipe] = useState(true);
  const swipeRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Auto-animate the before/after swipe on desktop (loops left-right)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) return; // mobile: skip, show video only
    if (!autoSwipe) return;

    let direction = -1; // start shrinking the "before" so video shows
    let pos = 60;
    const interval = setInterval(() => {
      if (dragging.current) return;
      pos += direction * 0.3;
      if (pos >= 65) direction = -1;
      if (pos <= 15) direction = 1;
      setSwipePos(pos);
    }, 40);
    return () => clearInterval(interval);
  }, [autoSwipe]);

  // Force video to play (browsers sometimes block autoplay until user interaction)
  useEffect(() => {
    if (!heroVideoUrl) return;
    const tryPlay = () => {
      document.querySelectorAll<HTMLVideoElement>("#top video").forEach((v) => {
        v.play().catch(() => {});
      });
    };
    tryPlay();
    const t = setTimeout(tryPlay, 500);
    const t2 = setTimeout(tryPlay, 2000);
    // Also try on first user interaction
    const onInteract = () => { tryPlay(); };
    window.addEventListener("click", onInteract, { once: true });
    window.addEventListener("touchstart", onInteract, { once: true });
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      window.removeEventListener("click", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, [heroVideoUrl]);

  const setFromClientX = (clientX: number) => {
    const el = swipeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSwipePos(Math.max(0, Math.min(100, pct)));
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        // resume auto-swipe after 3s of no interaction
        setTimeout(() => setAutoSwipe(true), 3000);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Mouse parallax for desktop image
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) return;
    const onMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const onCta = () => {
    if (!phone) return;
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventType: "whatsapp_click", metadata: { source: "hero_cta" } }) }).catch(() => {});
    fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source: "whatsapp_widget", message: "Clicked hero CTA" }) }).catch(() => {});
  };

  // Animated stats
  const { count: jobsCount, ref: jobsRef } = useCountUp(500);
  const { count: ratingCount, ref: ratingRef } = useCountUp(Math.round(avgRating * 10));

  return (
    <section ref={sectionRef} id="top" className="relative isolate overflow-hidden">
      {/* Background media with parallax */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: videoY }}>
        {/* VIDEO PLAYS ON ALL DEVICES — mobile shows video full-bleed,
            desktop shows before/after swipe effect with video as the "after" layer */}
        {heroVideoUrl ? (
          <>
            {/* Mobile: video only — no poster, starts immediately */}
            <video
              className="absolute inset-0 size-full object-cover md:hidden"
              autoPlay muted loop playsInline preload="auto"
              aria-hidden="true"
            >
              <source src={heroVideoUrl} type="video/mp4" />
            </video>

            {/* Desktop: before/after swipe effect
                "Before" layer = static image (dirty surface)
                "After" layer = video (clean surface being washed) — clipped by swipePos */}
            <div
              ref={swipeRef}
              className="absolute inset-0 hidden md:block"
              onPointerDown={(e) => { dragging.current = true; setAutoSwipe(false); setFromClientX(e.clientX); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setSwipePos((p) => Math.max(0, p - 5));
                if (e.key === "ArrowRight") setSwipePos((p) => Math.min(100, p + 5));
              }}
              tabIndex={0}
              role="slider"
              aria-valuenow={Math.round(swipePos)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Arrastra para ver antes y después"
              style={{ cursor: "ew-resize" }}
            >
              {/* After layer (video) — base, full width */}
              <div className="absolute inset-0 overflow-hidden" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)` }}>
                <video
                  className="size-full object-cover"
                  autoPlay muted loop playsInline preload="auto"
                  poster={heroVideoPoster ?? undefined}
                  aria-hidden="true"
                >
                  <source src={heroVideoUrl} type="video/mp4" />
                </video>
              </div>
              <span className="absolute top-4 right-4 rounded-md bg-black/60 text-white px-3 py-1.5 text-xs font-bold backdrop-blur-sm z-20">
                {lang === "en" ? "AFTER" : "DESPUÉS"}
              </span>

              {/* Before layer (static image) — clipped to left portion */}
              {beforeImage && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${swipePos}%` }}>
                  <img
                    src={beforeImage}
                    alt={lang === "en" ? "Before" : "Antes"}
                    className="absolute inset-0 h-full w-screen max-w-none object-cover"
                    style={{ width: "100vw" }}
                    draggable={false}
                  />
                  <span className="absolute top-4 left-4 rounded-md bg-black/60 text-white px-3 py-1.5 text-xs font-bold backdrop-blur-sm z-20">
                    {lang === "en" ? "BEFORE" : "ANTES"}
                  </span>
                </div>
              )}

              {/* Swipe handle */}
              <div className="absolute top-0 bottom-0 pointer-events-none z-30" style={{ left: `${swipePos}%`, transform: "translateX(-50%)" }}>
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <MoveHorizontal className="size-5 text-primary" />
                </div>
              </div>
            </div>
          </>
        ) : desktopImage ? (
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)` }}
          >
            <img src={desktopImage} alt="" className="size-full object-cover" fetchPriority="high" />
          </div>
        ) : (
          <div className="size-full animated-gradient">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />
          </div>
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 md:bg-gradient-to-br md:from-black/50 md:via-black/30 md:to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent hidden md:block" />
      </motion.div>

      {/* Floating particles (decorative) */}
      <div className="absolute inset-0 -z-5 pointer-events-none overflow-hidden hidden md:block">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 float-slow"
            style={{
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="container mx-auto px-4 sm:px-6 pt-16 pb-10 sm:pt-28 sm:pb-24 lg:pt-36 lg:pb-32 min-h-[88vh] flex flex-col justify-end sm:justify-center"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden sm:inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium text-white mb-6"
          >
            <Sparkles className="size-3.5 text-accent" />
            <span className="flex size-2 rounded-full bg-accent animate-pulse" />
            {lang === "en" ? "Professional pressure washing · Santa Cruz, Bolivia" : "Lavado a presión profesional · Santa Cruz, Bolivia"}
          </motion.div>

          {/* Headline with staggered word reveal */}
          <h1 className="text-2xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] sm:leading-[1.05] tracking-tight drop-shadow-2xl">
            {headline?.split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block mr-2"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hidden sm:block mt-5 text-lg lg:text-xl text-white/90 max-w-2xl leading-relaxed drop-shadow"
          >
            {sub}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-4 sm:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3"
          >
            {phone ? (
              <a
                href={buildWhatsAppUrl(normalizePhone(phone), greeting ?? "")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onCta}
                className="btn-shine glow-pulse inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-bold shadow-xl hover:bg-accent/90 hover:scale-[1.03] active:scale-95 transition-all"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl glass border border-white/30 text-white px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {lang === "en" ? "View services" : "Ver servicios"}
            </a>
          </motion.div>

          {/* Trust stats with count-up */}
          <div className="hidden sm:grid mt-12 grid-cols-3 gap-4 sm:gap-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-1.5 text-accent">
                <Zap className="size-5 fill-accent/30" />
                <span ref={jobsRef} className="text-2xl sm:text-3xl font-black text-white stat-glow">
                  {jobsCount}+
                </span>
              </div>
              <span className="text-xs sm:text-sm text-white/75 mt-1">
                {lang === "en" ? "Jobs completed" : "Trabajos realizados"}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.15 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-1.5 text-accent">
                <Star className="size-5 fill-accent" />
                <span ref={ratingRef} className="text-2xl sm:text-3xl font-black text-white stat-glow">
                  {(ratingCount / 10).toFixed(1)}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-white/75 mt-1">
                {lang === "en" ? "Avg rating" : "Calificación promedio"}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-1.5 text-accent">
                <Clock className="size-5" />
                <span className="text-2xl sm:text-3xl font-black text-white stat-glow">&lt;15m</span>
              </div>
              <span className="text-xs sm:text-sm text-white/75 mt-1">
                {lang === "en" ? "Response time" : "Tiempo de respuesta"}
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Swipe hint (desktop only) */}
      {heroVideoUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="hidden md:flex absolute bottom-8 right-8 items-center gap-2 glass rounded-full px-4 py-2 text-xs text-white font-medium z-20"
        >
          <MoveHorizontal className="size-3.5" />
          {lang === "en" ? "Drag to compare before / after" : "Arrastra para comparar antes / después"}
        </motion.div>
      )}

      {/* Animated scroll hint */}
      <motion.a
        href="#services"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors hidden sm:flex flex-col items-center gap-1"
        aria-label="Scroll"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-medium mb-1">
          {lang === "en" ? "Scroll" : "Desliza"}
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="size-6" />
        </motion.div>
      </motion.a>
    </section>
  );
}
