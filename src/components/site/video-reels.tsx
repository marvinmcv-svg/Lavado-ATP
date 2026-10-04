"use client";
// Video reel showcase — MOBILE-OPTIMIZED premium version.
// Performance: only plays videos when visible in viewport, pauses off-screen,
// uses preload="metadata", and disables heavy animations on mobile.
import { useRef, useState, useEffect } from "react";
import { Play, Volume2, VolumeX, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import type { GalleryItem, SiteSettings } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

export function VideoReels({ reels, settings }: { reels: GalleryItem[]; settings: SiteSettings | null }) {
  const lang = useLang((s) => s.lang);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const heroVideoUrl = settings?.heroVideoUrl ?? null;

  // Detect mobile for performance optimizations
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Determine if a reel has a real playable video
  const reelVideoUrl = (reel: GalleryItem): string | null => {
    const url = reel.mediaUrl;
    if (!url) return null;
    if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov") || url.endsWith(".m4v")) {
      return url;
    }
    return null;
  };

  const hasAnyReelVideo = reels.some((r) => reelVideoUrl(r) !== null);
  const fallbackVideo = hasAnyReelVideo ? null : heroVideoUrl;

  // Intersection Observer — only play visible videos, pause off-screen ones
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.idx);
          const video = videoRefs.current[idx];
          if (!video) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Only play if: not mobile, OR this is the centered card on mobile
            if (!isMobile || entry.intersectionRatio > 0.7) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.5, 0.7, 1], root: containerRef.current, rootMargin: "0px" },
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isMobile, hasAnyReelVideo]);

  // Initial play attempt (for desktop where IntersectionObserver may not fire immediately)
  useEffect(() => {
    if (isMobile) return; // mobile uses IO only
    const tryPlay = () => {
      videoRefs.current.forEach((v) => {
        if (v) {
          v.muted = true;
          v.play().catch(() => {});
        }
      });
    };
    tryPlay();
    const t1 = setTimeout(tryPlay, 1000);
    return () => clearTimeout(t1);
  }, [isMobile]);

  // Play on first user interaction (mobile autoplay unlock)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onInteract = () => {
      videoRefs.current.forEach((v) => {
        if (v && v.paused) {
          v.muted = true;
          v.play().catch(() => {});
        }
      });
    };
    window.addEventListener("click", onInteract, { once: true });
    window.addEventListener("touchstart", onInteract, { once: true });
    return () => {
      window.removeEventListener("click", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, []);

  if (reels.length === 0) return null;

  return (
    <section id="reels" className="py-16 sm:py-24 bg-secondary/40 scroll-mt-16 relative overflow-hidden">
      {/* Decorative blobs — disabled on mobile for performance */}
      {!isMobile && (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 right-10 size-64 rounded-full bg-accent/8 blur-3xl float-slow" />
          <div className="absolute bottom-10 -left-20 size-72 rounded-full bg-primary/8 blur-3xl float-medium" style={{ animationDelay: "1.2s" }} />
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge variant="secondary" className="mb-3 glass">
            <Film className="size-3.5 mr-1 text-accent" /> {lang === "en" ? "Watch us work" : "Míranos trabajar"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="text-gradient">{lang === "en" ? "Watch us work" : "Míranos trabajar"}</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">{lang === "en" ? "The satisfaction of watching grime disappear. Tap to hear." : "La satisfacción de ver la suciedad desaparecer. Toca para escuchar."}</p>
        </motion.div>

        {/* Reels carousel */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4"
        >
          {reels.map((reel, i) => {
            const poster = reel.posterUrl ?? reel.mediaUrl;
            const caption = lang === "en" ? reel.captionEn : reel.captionEs;
            const videoSrc = reelVideoUrl(reel) ?? fallbackVideo;
            return (
              <div
                key={reel.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                data-idx={i}
                className="group relative snap-center shrink-0 w-[260px] sm:w-[300px] aspect-[9/16] rounded-2xl overflow-hidden shadow-lg border border-border premium-card"
              >
                <button
                  onClick={() => setOpenIdx(i)}
                  className="size-full block"
                  aria-label={caption ?? "Reel"}
                >
                  {videoSrc ? (
                    <video
                      ref={(el) => { videoRefs.current[i] = el; }}
                      src={videoSrc}
                      poster={poster ?? undefined}
                      className="size-full object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      // Don't set autoPlay — IO will trigger play when visible
                    />
                  ) : (
                    <img src={poster} alt={caption ?? ""} className="size-full object-cover" loading="lazy" />
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />

                  {/* Play button — only for poster-only reels */}
                  {!videoSrc && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl">
                        <Play className="size-6 fill-primary ml-0.5" />
                      </span>
                    </div>
                  )}

                  {/* Top badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full glass-dark px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider pointer-events-none">
                    <span className="size-1.5 rounded-full bg-red-500" /> Reel
                  </div>

                  {/* Mute indicator */}
                  {videoSrc && (
                    <div className="absolute top-3 right-3 size-8 rounded-full glass-dark flex items-center justify-center text-white pointer-events-none">
                      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </div>
                  )}

                  {/* Caption */}
                  {caption && (
                    <p className="absolute bottom-0 inset-x-0 p-4 text-sm font-semibold text-white drop-shadow line-clamp-2 pointer-events-none">
                      {caption}
                    </p>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Hint */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground">
          {hasAnyReelVideo || fallbackVideo ? (
            <button
              onClick={() => {
                const next = !muted;
                setMuted(next);
                videoRefs.current.forEach((v) => { if (v) v.muted = next; });
              }}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              {lang === "en" ? "Click a reel to expand · muted by default" : "Clic en un reel para expandir · silenciado por defecto"}
            </button>
          ) : (
            <span className="text-amber-600 dark:text-amber-500">
              {lang === "en" ? "Upload videos in Admin → Site Editor → Videos" : "Sube videos en Admin → Editor → Videos"}
            </span>
          )}
        </div>
      </div>

      {/* Modal with video playback */}
      <Dialog open={openIdx !== null} onOpenChange={(o) => !o && setOpenIdx(null)}>
        <DialogContent
          className="max-w-md p-0 overflow-hidden bg-black border-none"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">
            {openIdx !== null ? (lang === "en" ? reels[openIdx].captionEn : reels[openIdx].captionEs) ?? "Reel" : "Reel"}
          </DialogTitle>
          <AnimatePresence mode="wait">
            {openIdx !== null && (
              <motion.div
                key={openIdx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="relative aspect-[9/16] w-full"
              >
                {(reelVideoUrl(reels[openIdx]) ?? fallbackVideo) ? (
                  <video
                    src={reelVideoUrl(reels[openIdx]) ?? fallbackVideo ?? undefined}
                    poster={reels[openIdx].posterUrl ?? reels[openIdx].mediaUrl}
                    className="size-full object-cover"
                    autoPlay
                    muted
                    controls
                    loop
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <img src={reels[openIdx].posterUrl ?? reels[openIdx].mediaUrl} alt="" className="size-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                <DialogClose className="absolute top-3 right-3 size-9 rounded-full glass-dark text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10" aria-label="Close">
                  ✕
                </DialogClose>
                {(lang === "en" ? reels[openIdx].captionEn : reels[openIdx].captionEs) && (
                  <div className="absolute bottom-0 inset-x-0 p-4 pointer-events-none">
                    <p className="text-sm font-semibold text-white drop-shadow">
                      {lang === "en" ? reels[openIdx].captionEn : reels[openIdx].captionEs}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
}
