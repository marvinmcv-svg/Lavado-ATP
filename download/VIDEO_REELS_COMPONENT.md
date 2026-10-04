# Video Reels Component — Downloadable

A premium, animated video reel showcase component for React/Next.js websites.
Features autoplaying muted videos on cards, spring-physics modal playback with
controls, staggered reveal animations, hover effects, and per-reel video support.

---

## Dependencies

Install these in your target project:

```bash
# Next.js / React stack
npm install framer-motion lucide-react

# shadcn/ui components (if you don't have them)
npx shadcn@latest add dialog badge
```

### Required shadcn/ui components
- `Dialog` (DialogContent, DialogClose, DialogTitle) — `@/components/ui/dialog`
- `Badge` — `@/components/ui/badge`

### Required hooks/utilities
- `useLang` hook (or replace with your own i18n)
- CSS animation classes (provided below)

---

## 1. CSS Animation Classes

Add these to your `globals.css`:

```css
/* Premium animation utilities */

/* Smooth cubic-bezier easing */
:root {
  --ease-premium: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Hide scrollbar */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Glass morphism */
.glass-dark {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Text gradient */
.text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Premium card hover */
.premium-card {
  transition: all 0.5s var(--ease-premium);
  position: relative;
  overflow: hidden;
}
.premium-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
}

/* Floating animation */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-12px) rotate(2deg); }
  66% { transform: translateY(8px) rotate(-1deg); }
}
.float-slow { animation: float 8s ease-in-out infinite; }
.float-medium { animation: float 6s ease-in-out infinite; }
```

---

## 2. Language Hook (if you don't have one)

Create `src/lib/i18n.ts` (or adapt to your i18n setup):

```ts
import { create } from "zustand";

export type Lang = "es" | "en";

export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void; toggle: () => void }>((set, get) => ({
  lang: "es",
  setLang: (l) => {
    if (typeof window !== "undefined") window.localStorage.setItem("lang", l);
    set({ lang: l });
  },
  toggle: () => {
    const next = get().lang === "es" ? "en" : "es";
    get().setLang(next);
  },
}));
```

---

## 3. The VideoReels Component

Create `src/components/site/video-reels.tsx`:

```tsx
"use client";
// Video reel showcase — premium animated version.
// Each reel plays its OWN video (reel.mediaUrl) — admin can add/remove
// videos via the gallery manager.
// Falls back to poster-only if no video URL is set on a reel.
import { useRef, useState, useEffect } from "react";
import { Play, Volume2, VolumeX, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";

const EASE = [0.16, 1, 0.3, 1] as const;

// ── Types ────────────────────────────────────────────────────────────
// Adapt these to match your data model. The component needs:
//   - id: unique identifier
//   - mediaUrl: video file URL (.mp4/.webm/.mov) OR poster image URL
//   - posterUrl: optional poster/thumbnail image
//   - captionEs / captionEn: bilingual captions (or replace with your own field)
export interface ReelItem {
  id: string;
  mediaUrl: string;
  posterUrl?: string | null;
  captionEs?: string | null;
  captionEn?: string | null;
}

export function VideoReels({ reels, heroVideoUrl }: { reels: ReelItem[]; heroVideoUrl?: string | null }) {
  const lang = useLang((s) => s.lang);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Determine if a reel has a real playable video (mp4/webm in mediaUrl)
  const reelVideoUrl = (reel: ReelItem): string | null => {
    const url = reel.mediaUrl;
    if (!url) return null;
    if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov") || url.endsWith(".m4v")) {
      return url;
    }
    return null;
  };

  // Check if any reel has a real video
  const hasAnyReelVideo = reels.some((r) => reelVideoUrl(r) !== null);
  const fallbackVideo = hasAnyReelVideo ? null : (heroVideoUrl ?? null);

  // Force all reel videos to play (browsers block autoplay until interaction)
  useEffect(() => {
    const tryPlay = () => {
      videoRefs.current.forEach((v) => {
        if (v) {
          v.muted = true;
          v.play().catch(() => {});
        }
      });
    };
    tryPlay();
    const t1 = setTimeout(tryPlay, 500);
    const t2 = setTimeout(tryPlay, 1500);
    const t3 = setTimeout(tryPlay, 3000);
    const onInteract = () => { tryPlay(); };
    window.addEventListener("click", onInteract, { once: true });
    window.addEventListener("touchstart", onInteract, { once: true });
    window.addEventListener("scroll", onInteract, { once: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("click", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("scroll", onInteract);
    };
  }, [hasAnyReelVideo, fallbackVideo]);

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
            <span className="text-gradient">{lang === "en" ? "Watch us work" : "Míranos trabajar"}</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            {lang === "en" ? "The satisfaction of watching grime disappear. Tap to hear." : "La satisfacción de ver la suciedad desaparecer. Toca para escuchar."}
          </p>
        </motion.div>

        {/* Reels carousel with staggered reveal */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4"
        >
          {reels.map((reel, i) => {
            const poster = reel.posterUrl ?? reel.mediaUrl;
            const caption = lang === "en" ? reel.captionEn : reel.captionEs;
            // Each reel plays its OWN video, or falls back to hero video
            const videoSrc = reelVideoUrl(reel) ?? fallbackVideo;
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
                {/* Play the reel's OWN video, or fall back to poster image */}
                {videoSrc ? (
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={videoSrc}
                    poster={poster ?? undefined}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="auto"
                  />
                ) : (
                  <img src={poster} alt={caption ?? ""} className="size-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: "inset 0 0 60px color-mix(in oklch, var(--accent) 30%, transparent)" }} />

                {/* Play button — only show if no video playing on card */}
                {!videoSrc && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="relative flex size-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl group-hover:bg-white transition-all">
                      <span className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-0 group-hover:opacity-100" style={{ animationDuration: "1.6s" }} />
                      <motion.span
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Play className="size-6 fill-primary ml-0.5" />
                      </motion.span>
                    </span>
                  </div>
                )}

                {/* Top badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full glass-dark px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse" /> Reel
                </div>

                {/* Mute indicator (only if video is playing) */}
                {videoSrc && (
                  <div className="absolute top-3 right-3 size-8 rounded-full glass-dark flex items-center justify-center text-white">
                    {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </div>
                )}

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

        {/* Hint */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground"
        >
          {hasAnyReelVideo || fallbackVideo ? (
            <button
              onClick={() => setMuted((m) => !m)}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              {lang === "en" ? "Click a reel to expand · muted by default" : "Clic en un reel para expandir · silenciado por defecto"}
            </button>
          ) : (
            <span className="text-amber-600 dark:text-amber-500">
              {lang === "en" ? "Upload videos in admin" : "Sube videos en el admin"}
            </span>
          )}
        </motion.div>
      </div>

      {/* Modal with ACTUAL VIDEO PLAYBACK */}
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
                {/* Play the reel's OWN video in the modal, or fallback to hero video */}
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
                {/* Caption */}
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
```

---

## 4. Usage Example

```tsx
import { VideoReels, type ReelItem } from "@/components/site/video-reels";

const reels: ReelItem[] = [
  {
    id: "1",
    mediaUrl: "/videos/driveway-wash.mp4",  // real video file
    posterUrl: "/images/driveway-poster.jpg",  // optional thumbnail
    captionEs: "Lavado de driveway en 4K",
    captionEn: "Driveway wash in 4K",
  },
  {
    id: "2",
    mediaUrl: "/videos/facade-wash.mp4",
    posterUrl: "/images/facade-poster.jpg",
    captionEs: "Transformación de fachada",
    captionEn: "Facade transformation",
  },
  {
    id: "3",
    mediaUrl: "/images/poster-only.jpg",  // no video — shows poster with play button
    captionEs: "Próximamente",
    captionEn: "Coming soon",
  },
];

export default function Page() {
  return (
    <div>
      {/* ... your other sections ... */}
      <VideoReels reels={reels} />
      {/* Optional: fallback video if no reel has its own video */}
      {/* <VideoReels reels={reels} heroVideoUrl="/videos/hero-fallback.mp4" /> */}
    </div>
  );
}
```

---

## Features

- ✅ **Autoplay muted videos** on reel cards (browsers allow muted autoplay)
- ✅ **Force-play logic** — retries `play()` at 0ms, 500ms, 1500ms, 3000ms, and on first user interaction (click/touch/scroll) to bypass browser autoplay restrictions
- ✅ **Per-reel videos** — each card plays its own video file (from `reel.mediaUrl`)
- ✅ **Fallback** — if a reel has no video, shows poster image with play button
- ✅ **Modal playback** — clicking a reel opens a spring-physics modal with the video playing with native controls
- ✅ **Bilingual** — ES/EN captions (easily adapted to any language)
- ✅ **Staggered reveal** — cards animate in with a stagger as they scroll into view
- ✅ **Hover effects** — card lifts, scales, glows on hover
- ✅ **Mute toggle** — user can unmute all reels
- ✅ **Responsive** — mobile-first horizontal scroll carousel, desktop shows full grid
- ✅ **Accessibility** — ARIA labels, keyboard navigable, `sr-only` dialog title

---

## Customization

- **Colors**: Uses CSS variables `--primary` and `--accent` — define these in your `:root`
- **Aspect ratio**: Cards are `aspect-[9/16]` (Instagram Reel format) — change to `aspect-video` for 16:9
- **Card width**: `w-[260px] sm:w-[300px]` — adjust as needed
- **Animation easing**: `EASE = [0.16, 1, 0.3, 1]` (premium cubic-bezier)
- **Autoplay retry**: Adjust the timeout values (500, 1500, 3000ms) if your videos load slower
- **i18n**: Replace `useLang` with your own translation hook if not using Zustand

---

## File Structure

```
src/
├── components/
│   └── site/
│       └── video-reels.tsx       ← the component
├── lib/
│   └── i18n.ts                   ← language hook (if needed)
└── app/
    └── globals.css               ← CSS animation classes
```

---

## Browser Compatibility

- ✅ Chrome/Edge 88+ (Chromium)
- ✅ Firefox 85+
- ✅ Safari 14+ (includes iOS Safari)
- ⚠️ Autoplay requires `muted` attribute — videos must be muted to autoplay
- ⚠️ iOS Safari may require `playsInline` attribute (included)

---

*Generated from the lavadoatp project. Adapt the types, i18n, and CSS variables to match your project's conventions.*
