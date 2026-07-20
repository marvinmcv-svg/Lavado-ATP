"use client";
// Video reel showcase — premium animated version.
// Staggered card reveal, hover scale + glow, pulsing play button, spring modal.
// NOTE: 0 real Reel video files in this sandbox build (see DATA_AUDIT.md).
// The section renders poster cards; clicking opens an enlarged view.
import { useRef, useState } from "react";
import { Play, Volume2, VolumeX, Film, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import type { GalleryItem } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

export function VideoReels({ reels }: { reels: GalleryItem[] }) {
  const lang = useLang((s) => s.lang);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  if (reels.length === 0) return null;

  return (
    <section id="reels" className="py-16 sm:py-24 bg-secondary/40 scroll-mt-16 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 right-10 size-64 rounded-full bg-accent/8 blur-3xl float-slow" />
        <div className="absolute bottom-10 -left-20 size-72 rounded-full bg-primary/8 blur-3xl float-medium" style={{ animationDelay: "1.2s" }} />
      </div>

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
            <span className="text-gradient">{t(lang, "reels_title")}</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "reels_subtitle")}</p>
        </motion.div>

        {/* Reels carousel with staggered reveal */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4"
        >
          {reels.map((reel, i) => {
            const poster = reel.posterUrl ?? reel.mediaUrl;
            const caption = lang === "en" ? reel.captionEn : reel.captionEs;
            return (
              <motion.button
                key={reel.id}
                onClick={() => setOpenIdx(i)}
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative snap-start shrink-0 w-[260px] sm:w-[300px] aspect-[9/16] rounded-2xl overflow-hidden shadow-lg border border-border premium-card"
                aria-label={caption ?? "Reel"}
              >
                <img src={poster} alt={caption ?? ""} className="size-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: "inset 0 0 60px color-mix(in oklch, var(--accent) 30%, transparent)" }} />

                {/* Play button with pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="relative flex size-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl group-hover:bg-white transition-all">
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-0 group-hover:opacity-100" style={{ animationDuration: "1.6s" }} />
                    <motion.span
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Play className="size-6 fill-primary ml-0.5" />
                    </motion.span>
                  </span>
                </div>

                {/* Top badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full glass-dark px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse" /> Reel
                </div>

                {/* Caption */}
                {caption && (
                  <p className="absolute bottom-0 inset-x-0 p-4 text-sm font-semibold text-white drop-shadow line-clamp-2">
                    {caption}
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Mute hint + data-audit notice */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground"
        >
          <button
            onClick={() => setMuted((m) => !m)}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
            {lang === "en" ? "Tap a reel to play · muted by default" : "Toca un reel para reproducir · silenciado por defecto"}
          </button>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
            <AlertCircle className="size-3.5" />
            {lang === "en" ? "Demo: poster-only. Owner uploads Reels in Admin." : "Demo: solo póster. El dueño sube Reels en Admin."}
          </span>
        </motion.div>
      </div>

      {/* Modal with spring physics */}
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
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.8 }}
                className="relative aspect-[9/16] w-full"
              >
                <img src={reels[openIdx].posterUrl ?? reels[openIdx].mediaUrl} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <DialogClose className="absolute top-3 right-3 size-9 rounded-full glass-dark text-white flex items-center justify-center hover:bg-black/70 transition-colors" aria-label="Close">
                  ✕
                </DialogClose>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
                    className="relative size-16 rounded-full glass flex items-center justify-center mb-4"
                  >
                    <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" style={{ animationDuration: "2s" }} />
                    <Play className="size-7 fill-white ml-1 relative" />
                  </motion.div>
                  <p className="text-sm font-semibold max-w-xs">
                    {lang === "en"
                      ? "Real Reel video plays here once uploaded in Admin → Site Editor → Videos."
                      : "El video Reel real se reproduce aquí al subirlo en Admin → Editor → Videos."}
                  </p>
                  <p className="text-xs text-white/70 mt-2 max-w-xs">
                    {lang === "en" ? reels[openIdx].captionEn : reels[openIdx].captionEs}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
}
