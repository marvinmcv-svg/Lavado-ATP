"use client";
// Before/After drag-to-reveal slider (Step 3.4) — pointer + keyboard accessible.
import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal, Camera } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BeforeAfterPair } from "@/lib/types";

export function BeforeAfter({ pairs }: { pairs: BeforeAfterPair[] }) {
  const lang = useLang((s) => s.lang);
  const [active, setActive] = useState(0);

  if (pairs.length === 0) return null;
  const pair = pairs[active];

  return (
    <section id="before-after" className="py-16 sm:py-24 scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="mb-3">
            <Camera className="size-3.5 mr-1" /> {lang === "en" ? "Real results" : "Resultados reales"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{t(lang, "beforeafter_title")}</h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "beforeafter_subtitle")}</p>
        </div>

        {/* Slider */}
        <div className="max-w-4xl mx-auto">
          <Slider pair={pair} lang={lang} />
        </div>

        {/* Pair thumbnails */}
        {pairs.length > 1 && (
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            {pairs.map((p, i) => (
              <button
                key={p.pairId}
                onClick={() => setActive(i)}
                className={cn(
                  "relative size-16 sm:size-20 rounded-lg overflow-hidden border-2 transition-all",
                  active === i ? "border-primary scale-105 shadow-lg" : "border-border opacity-60 hover:opacity-100",
                )}
                aria-label={`${t(lang, "beforeafter_title")} ${i + 1}`}
              >
                <img src={p.after.mediaUrl} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Slider({ pair, lang }: { pair: BeforeAfterPair; lang: "es" | "en" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const dragging = useRef(false);

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
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setFromClientX]);

  const startDrag = (e: React.PointerEvent) => {
    dragging.current = true;
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
        <img src={pair.after.mediaUrl} alt={t(lang, "after")} className="absolute inset-0 size-full object-cover" draggable={false} />
        <span className="absolute top-3 right-3 rounded-md bg-black/60 text-white px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
          {t(lang, "after")}
        </span>

        {/* Before image (clipped) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <img
            src={pair.before.mediaUrl}
            alt={t(lang, "before")}
            className="absolute inset-0 h-full max-w-none object-cover"
            style={{ width: containerWidth > 0 ? `${containerWidth}px` : "100%" }}
            draggable={false}
          />
          <span className="absolute top-3 left-3 rounded-md bg-black/60 text-white px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
            {t(lang, "before")}
          </span>
        </div>

        {/* Handle */}
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-11 rounded-full bg-white shadow-xl flex items-center justify-center">
            <MoveHorizontal className="size-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  );
}
