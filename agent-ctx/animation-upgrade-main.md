## Premium Animation Upgrade — 5 Site Components

**Task ID:** animation-upgrade
**Agent:** main

### Work Log
Upgraded 5 components in `src/components/site/` to a $50k-tier premium look using Framer Motion + the existing CSS animation system in `globals.css`.

**1. `before-after.tsx`** — Before/After slider
- Framer Motion section header (fade-up + `text-gradient` title)
- Animated slider handle with `glow-pulse` when dragging (spring-physics scale on knob + line)
- Vertical line glow swaps to bright accent blue (`shadow-[0_0_16px_rgba(74,144,226,0.9)]`) on drag
- Fade-in caption via `AnimatePresence`
- Section reveal with `whileInView` + `viewport={{ once: true, margin: "-80px" }}`
- Three decorative floating gradient blobs (`float-slow/medium/fast`) in background
- Slider container does a subtle `scale: 0.96 → 1` mount animation
- Thumbnails: staggered scale-in + spring `layoutId` ring on active
- Pointer/keyboard accessibility preserved (role=slider, ArrowLeft/Right keys, aria-* attributes)

**2. `video-reels.tsx`** — Video Reels
- Framer Motion staggered card reveal (`opacity/y/scale` + 0.1s delay per card)
- Hover: `whileHover={{ y: -6, scale: 1.03 }}` + `premium-card` glow overlay
- Animated play button: `motion.span` scale pulse (1→1.08→1) + `bg-white/40 animate-ping` ring on hover
- Section header with fade-up + `text-gradient` title
- Modal: `AnimatePresence` + `type="spring"` `stiffness:260, damping:24, mass:0.8` for open/close
- Modal play icon: spring scale-in + pulsing backdrop
- Decorative blobs (float-slow/medium)
- Mute hint is now an interactive button (was a static label)

**3. `quote-calculator.tsx`** — Quote Calculator
- `AnimatePresence mode="wait"` for step transitions (slide in from right, slide out to left)
- Spring-physics step indicator: active circle bounces (`scale: [1,1.15,1]`), check icon spins in with `type: spring, stiffness:300, damping:18`
- Animated step-progress connector (`width: 0% → 100%` morph)
- Glow pulse on the result estimate card (`.glow-pulse` class)
- Animated count-up for price range — custom `useAnimatedNumber` hook (rAF-based, ease-out cubic, respects prefers-reduced-motion)
- Hover effects on service buttons (`whileHover scale:1.02, y:-2` + shine overlay + ArrowRight slide-in)
- Hover effects on size buttons (`whileHover scale:1.04, y:-3`)
- WhatsApp confirm button uses `btn-shine` class
- Section header fade-up + decorative floating blobs + `text-gradient` title
- All WhatsApp /api/track + /api/leads calls + bilingual labels preserved

**4. `service-area.tsx`** — Service Area
- Framer Motion section header (fade-up + `text-gradient` title)
- Map card with subtle `scale: 0.96 → 1` mount animation
- Hours card with fade-up (delay 0.2s)
- Staggered zone list reveal (each zone slides in from left with spring `CheckCircle2`)
- Animated "Abierto/Cerrado" badge: spring scale-in + pinging dot (1.5s) when open, emerald-600 background; static muted dot when closed
- Hours list rows stagger in with small left-slide
- `premium-card` class on both cards
- Directions link uses `link-underline` animated underline
- Decorative blobs (float-slow/medium)
- Map iframe, hours clock, bilingual labels, OSM embed — all preserved

**5. `reviews.tsx`** — Reviews
- Framer Motion staggered card reveal (0.1s delay per card)
- 3D card tilt on hover (pointer-driven `perspective(1000px) rotateX/Y` — disabled on mobile via `(max-width: 768px)` matchMedia)
- Star rating with pop-in animation (`scale: 0→1, rotate: -45°→0°` spring per star)
- Average rating number with count-up (custom `useAnimatedCount` hook — no ref, triggered by Framer Motion `onViewportEnter` callback)
- Section header with fade-up + `text-gradient` title
- `Quote` icon spins/springs in on each card (`scale:0, rotate:-90 → scale:1, rotate:0`)
- "Get your free quote" CTA button uses `btn-shine` + spring hover
- Decorative blobs (amber + primary, float-slow/medium)
- Average rating displayed as `X.X` (decimal animates too via `Math.round(average*10)/10`)

### Cross-cutting technical notes
- All animations use premium easing `ease: [0.16, 1, 0.3, 1]` (cubic-bezier)
- All `whileInView` use `viewport={{ once: true, margin: "-80px" }}`
- `prefers-reduced-motion` respected (rAF-based count-ups early-return with target value)
- Component signatures (props/exports) unchanged — no breaking changes to page composition
- All API calls (`/api/track`, `/api/leads`, `/api/...`) and bilingual `lang === "en" ? ... : ...` patterns preserved
- Used CSS classes from globals.css: `premium-card`, `glass`, `glass-dark`, `text-gradient`, `glow-pulse`, `float-slow/medium/fast`, `stat-glow`, `btn-shine`, `link-underline`, `card-3d`, `bg-water-texture`, `animated-gradient`, `bg-water-texture`, `no-scrollbar`

### Lint
- Modified files (before-after, video-reels, quote-calculator, service-area, reviews): **0 errors**
- Pre-existing lint errors in `hero.tsx` (lines 199, 200) and `use-reveal.ts` (line 56) were NOT touched per task constraints ("Do NOT modify hero.tsx or services.tsx / Do NOT modify globals.css or use-reveal.ts")
- Dev server: page renders successfully (HTTP 200, ~120ms), no runtime errors in dev.log
