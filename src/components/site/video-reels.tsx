"use client";
// Video reel showcase (Step 3.5) — poster cards with play overlay.
// NOTE: 0 real Reel video files in this sandbox build (see DATA_AUDIT.md).
// The section renders poster cards; clicking opens an enlarged view.
import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX, Film, AlertCircle } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import type { GalleryItem } from "@/lib/types";

export function VideoReels({ reels }: { reels: GalleryItem[] }) {
  const lang = useLang((s) => s.lang);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  if (reels.length === 0) return null;

  return (
    <section id="reels" className="py-16 sm:py-24 bg-secondary/40 scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="mb-3">
            <Film className="size-3.5 mr-1" /> {lang === "en" ? "Watch us work" : "Míranos trabajar"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{t(lang, "reels_title")}</h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "reels_subtitle")}</p>
        </div>

        {/* Reels carousel */}
        <div ref={containerRef} className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4">
          {reels.map((reel, i) => {
            const poster = reel.posterUrl ?? reel.mediaUrl;
            const caption = lang === "en" ? reel.captionEn : reel.captionEs;
            return (
              <button
                key={reel.id}
                onClick={() => setOpenIdx(i)}
                className="group relative snap-start shrink-0 w-[260px] sm:w-[300px] aspect-[9/16] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-border"
                aria-label={caption ?? "Reel"}
              >
                <img src={poster} alt={caption ?? ""} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl group-hover:scale-110 group-hover:bg-white transition-all">
                    <Play className="size-6 fill-primary ml-0.5" />
                  </span>
                </div>

                {/* Top badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse" /> Reel
                </div>

                {/* Caption */}
                {caption && (
                  <p className="absolute bottom-0 inset-x-0 p-4 text-sm font-semibold text-white drop-shadow line-clamp-2">
                    {caption}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Mute hint + data-audit notice */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
            {lang === "en" ? "Tap a reel to play · muted by default" : "Toca un reel para reproducir · silenciado por defecto"}
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
            <AlertCircle className="size-3.5" />
            {lang === "en" ? "Demo: poster-only. Owner uploads Reels in Admin." : "Demo: solo póster. El dueño sube Reels en Admin."}
          </span>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={openIdx !== null} onOpenChange={(o) => !o && setOpenIdx(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none" aria-describedby={undefined}>
          <DialogTitle className="sr-only">
            {openIdx !== null ? (lang === "en" ? reels[openIdx].captionEn : reels[openIdx].captionEs) ?? "Reel" : "Reel"}
          </DialogTitle>
          {openIdx !== null && (
            <div className="relative aspect-[9/16] w-full">
              <img src={reels[openIdx].posterUrl ?? reels[openIdx].mediaUrl} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              <DialogClose className="absolute top-3 right-3 size-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70" aria-label="Close">
                ✕
              </DialogClose>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
                <div className="size-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
                  <Play className="size-7 fill-white ml-1" />
                </div>
                <p className="text-sm font-semibold max-w-xs">
                  {lang === "en"
                    ? "Real Reel video plays here once uploaded in Admin → Site Editor → Videos."
                    : "El video Reel real se reproduce aquí al subirlo en Admin → Editor → Videos."}
                </p>
                <p className="text-xs text-white/70 mt-2 max-w-xs">
                  {lang === "en" ? reels[openIdx].captionEn : reels[openIdx].captionEs}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
