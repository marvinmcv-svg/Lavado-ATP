"use client";
// Before/After drag-to-reveal slider — premium animated version.
// Pointer + keyboard accessible. Animated handle with glow, fade-in caption,
// staggered thumbnails, decorative floating gradient blobs, scale-in slider.
import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BeforeAfterPair } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

export function BeforeAfter({ pairs }: { pairs: BeforeAfterPair[] }) {
  const lang = useLang((s) => s.lang);
  const [active, setActive] = useState(0);

  if (pairs.length === 0) return null;
  const pair = pairs[active];

  return (
    <section id="before-after" className="py-16 sm:py-24 scroll-mt-16 relative overflow-hidden">
      {/* Decorative floating gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl float-slow" />
        <div className="absolute -bottom-24 -right-24 size-80 rounded-full bg-accent/10 blur-3xl float-medium" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 right-1/4 size-48 rounded-full bg-primary/5 blur-3xl float-fast" style={{ animationDelay: "0.8s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge variant="secondary" className="mb-3 glass">
            <Camera className="size-3.5 mr-1 text-accent" /> {lang === "en" ? "Real results" : "Resultados reales"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="text-gradient">{t(lang, "beforeafter_title")}</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "beforeafter_subtitle")}</p>
        </motion.div>

        {/* Slider — scales in on mount */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pair.pairId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <Slider pair={pair} lang={lang} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Pair thumbnails */}
        {pairs.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="mt-6 flex justify-center gap-3 flex-wrap"
          >
            {pairs.map((p, i) => (
              <motion.button
                key={p.pairId}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08, ease: EASE }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative size-16 sm:size-20 rounded-lg overflow-hidden border-2 transition-all",
                  active === i ? "border-primary scale-105 shadow-lg shadow-primary/30" : "border-border opacity-60 hover:opacity-100",
                )}
                aria-label={`${t(lang, "beforeafter_title")} ${i + 1}`}
              >
                <img src={p.after.mediaUrl} alt="" className="size-full object-cover" loading="lazy" />
                {active === i && (
                  <motion.div
                    layoutId="activeThumb"
                    className="absolute inset-0 ring-2 ring-primary rounded-lg pointer-events-none"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Slider({ pair, lang }: { pair: BeforeAfterPair; lang: "es" | "en" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setFromClientX]);

  const startDrag = (e: React.PointerEvent) => {
    draggingRef.current = true;
    setDragging(true);
    setFromClientX(e.clientX);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
  };

  const caption = lang === "en" ? pair.after.captionEn : pair.after.captionEs;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-2xl border border-border select-none touch-none cursor-ew-resize bg-muted"
        onPointerDown={startDrag}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t(lang, "beforeafter_drag")}
      >
        {/* After image (base) */}
        <img src={pair.after.mediaUrl} alt={t(lang, "after")} className="absolute inset-0 size-full object-cover pointer-events-none" draggable={false} />
        <span className="absolute top-3 right-3 rounded-md glass-dark text-white px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
          {t(lang, "after")}
        </span>

        {/* Before image (clipped) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: `${pos}%` }}>
          <img
            src={pair.before.mediaUrl}
            alt={t(lang, "before")}
            className="absolute inset-0 h-full max-w-none object-cover"
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : "100%" }}
            draggable={false}
          />
          <span className="absolute top-3 left-3 rounded-md glass-dark text-white px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
            {t(lang, "before")}
          </span>
        </div>

        {/* Handle */}
        <motion.div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          animate={{ scale: dragging ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Vertical line with glow */}
          <div
            className={cn(
              "absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white transition-shadow duration-300",
              dragging ? "shadow-[0_0_16px_rgba(74,144,226,0.9)]" : "shadow-[0_0_8px_rgba(0,0,0,0.4)]",
            )}
          />
          {/* Handle knob with glow */}
          <motion.div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-11 rounded-full bg-white shadow-xl flex items-center justify-center",
              dragging ? "glow-pulse" : "",
            )}
            animate={{ scale: dragging ? 1.12 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            {/* Outer ring */}
            <span className="absolute inset-0 rounded-full border-2 border-primary/30" />
            <MoveHorizontal className="size-5 text-primary" />
          </motion.div>
        </motion.div>

        {/* Subtle bottom gradient for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Caption with fade-in */}
      <AnimatePresence mode="wait">
        {caption && (
          <motion.p
            key={caption}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-3 text-center text-sm text-muted-foreground"
          >
            {caption}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
