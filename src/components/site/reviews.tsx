"use client";
// Social proof — premium animated version.
// Staggered card reveal, 3D tilt on hover, star pop-in animation,
// average rating circle with count-up, Framer Motion section header.
import { useEffect, useRef, useState } from "react";
import { Star, Quote, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Review } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Animated count-up triggered by an external `active` flag (no ref needed). */
function useAnimatedCount(target: number, active: boolean, duration = 1400): number {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prevRef.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const startVal = prevRef.current;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function StarRow({
  rating,
  size = "size-4",
  animate = false,
  delay = 0,
}: {
  rating: number;
  size?: string;
  animate?: boolean;
  delay?: number;
}) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.span
          key={n}
          initial={animate ? { scale: 0, rotate: -45 } : false}
          whileInView={animate ? { scale: 1, rotate: 0 } : undefined}
          viewport={animate ? { once: true } : undefined}
          transition={animate ? { type: "spring", stiffness: 300, damping: 14, delay: delay + n * 0.08 } : undefined}
          className="inline-flex"
        >
          <Star className={`${size} ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />
        </motion.span>
      ))}
    </div>
  );
}

export function Reviews({ reviews, average }: { reviews: Review[]; average: number }) {
  const lang = useLang((s) => s.lang);
  const [avgInView, setAvgInView] = useState(false);
  // Count-up for average rating (one decimal). We count to Math.round(average*10)
  // then divide by 10 so the decimal animates too.
  const avgCount = useAnimatedCount(Math.round(average * 10), avgInView, 1400);

  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className="py-16 sm:py-24 scroll-mt-16 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-1/4 size-72 rounded-full bg-amber-400/8 blur-3xl float-slow" />
        <div className="absolute bottom-0 -left-20 size-80 rounded-full bg-primary/8 blur-3xl float-medium" style={{ animationDelay: "1.4s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading with fade-up */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge variant="secondary" className="mb-3 glass">
            <Star className="size-3.5 mr-1 fill-amber-400 text-amber-400" /> {lang === "en" ? "Reviews" : "Reseñas"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="text-gradient">{t(lang, "reviews_title")}</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "reviews_subtitle")}</p>

          {/* Average rating circle with count-up */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            onViewportEnter={() => setAvgInView(true)}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="mt-6 inline-flex items-center gap-4 rounded-full bg-secondary px-6 py-3 shadow-sm"
          >
            <span
              className="text-4xl font-black stat-glow tabular-nums"
            >
              {(avgCount / 10).toFixed(1)}
            </span>
            <div className="flex flex-col items-start">
              <StarRow rating={Math.round(average)} animate delay={0.3} />
              <span className="text-xs text-muted-foreground mt-0.5">
                {t(lang, "reviews_based_on")} {reviews.length} {t(lang, "reviews_count")}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Reviews grid with staggered reveal + 3D tilt */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} index={i} lang={lang} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          className="mt-10 text-center"
        >
          <p className="text-muted-foreground mb-3">{lang === "en" ? "Become our next happy customer" : "Sé nuestro próximo cliente feliz"}</p>
          <a
            href="#quote"
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 hover:scale-[1.03] active:scale-95 transition-all"
          >
            <MessageCircle className="size-5" /> {lang === "en" ? "Get your free quote" : "Pide tu cotización gratis"}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/** Review card with 3D tilt on hover (desktop pointer-driven). */
function ReviewCard({ review: r, index, lang }: { review: Review; index: number; lang: "es" | "en" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * 6, ry: px * 6 });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  const initials = r.reviewerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
        className="card-3d"
      >
        <Card className="p-6 flex flex-col premium-card h-full">
          <div className="flex items-start justify-between mb-3">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: index * 0.1 + 0.2 }}
            >
              <Quote className="size-8 text-primary/20" />
            </motion.div>
            <StarRow rating={r.starRating} animate delay={index * 0.1 + 0.25} />
          </div>
          <p className="text-sm text-foreground leading-relaxed flex-1">“{r.reviewText}”</p>
          <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{r.reviewerName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {r.source} · {new Date(r.reviewDate).toLocaleDateString(lang === "en" ? "en-US" : "es-BO", { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
