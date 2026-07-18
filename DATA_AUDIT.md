# DATA_AUDIT.md — lavadoatp

Field-by-field log of every data point used on this site, its source, and its
value (or null + reason). Required by Step 0C of the master prompt.

> **Environment note:** This build runs in a sandbox without live access to
> the ScrapeCreators / Apify / Bright Data Instagram scraper APIs or the
> Google Maps Places API. The Instagram + web-search pipeline (Step 0A/0B)
> was therefore executed manually: public web image search (real photographs,
> not AI-generated) was used as the media source, and business data was
> structured from the lavadoatp brand brief in the master prompt plus
> realistic Bolivia/Santa-Cruz-specific defaults. Every field below is marked
> with its real provenance. When the owner connects the live scrapers, the
> admin "Re-sync from Instagram" action (Site Editor) will overwrite these.

## Business fields

| Field             | Source                          | Value                                       | Status |
|-------------------|---------------------------------|---------------------------------------------|--------|
| business_name     | Master prompt input             | `lavadoatp`                                 | ✅ set |
| slug              | derived from name               | `lavadoatp`                                 | ✅ set |
| phone             | placeholder (Bolivia mobile)    | `+591 707 14288`                            | ⚠️ MANUAL_CONFIRM — owner must verify real number |
| address           | estimated (Santa Cruz default)  | `Av. Radial 27, Santa Cruz de la Sierra`    | ⚠️ MANUAL_CONFIRM — confirm real address or switch to zone-only |
| lat / lng         | estimated city center           | `-17.7833, -63.1821`                        | ⚠️ approximate |
| service_area      | brand brief + Santa Cruz zones  | radius 25km, 8 zones                        | ⚠️ confirm real coverage |
| opening_hours     | Bolivia business default        | Mon–Fri 08–18, Sat 08–16, Sun closed        | ⚠️ MANUAL_CONFIRM |
| service_type      | niche                           | `Pressure washing service`                  | ✅ set |
| languages         | Bolivia default                 | `["es","en"]`                               | ✅ set |
| brand_colors      | extracted from niche palette    | teal `#0f766e`, amber `#f59e0b`, cyan `#06b6d4` | ✅ set (WCAG AA verified) |
| timezone          | Bolivia                         | `America/La_Paz`                            | ✅ set |
| currency          | Bolivia                         | `BOB`                                       | ✅ set |
| instagram_url     | master prompt input             | `https://www.instagram.com/lavadoatp/`      | ✅ set |

## Media (ZERO-AI-MEDIA RULE compliance)

| Asset type            | Source                                         | Count | Notes |
|-----------------------|------------------------------------------------|-------|-------|
| Hero image            | Public web image search (real photo)           | 1     | Real pressure-washing photograph, not AI-generated |
| Service card photos   | Public web image search (real photos)          | 10    | Real photographs |
| Before/After pairs    | Public web image search (real photos)          | 3 pairs | ⚠️ **Same-job pairing NOT verified** — these are real pressure-washing photos but sourced from different public web posts, not the same lavadoatp job. The owner MUST upload real same-job pairs via Admin → Site Editor → Antes y Después before going live. The slider component is fully functional; only the source imagery is a stand-in for demo purposes. |
| General gallery       | Public web image search (real photos)          | 4     | Real photographs |
| Video reels           | Poster images only (real photos)               | 3     | 🚨 **0 real Reel video files available.** Per Step 0C this is a launch-blocking gap. The reels section renders poster cards with play overlays; the actual `.mp4` Reel files must be uploaded via Admin → Site Editor → Videos. No AI-generated video is used. |
| Logo                  | null                                           | —     | Renders as text wordmark `lavadoatp`; owner uploads real logo in Settings |

**WCAG AA contrast:** brand teal `#0f766e` on white = 5.41:1 (passes AA for
normal text). Amber `#f59e0b` is used only on large text / non-text UI.

## Reviews

| Source   | Count | Notes |
|----------|-------|-------|
| Manual   | 6     | Representative review text for demo. Real Google/Facebook reviews must be imported via Admin → Reviews once the owner connects the Google Places API. |

## Services & pricing

10 services seeded across Residential / Commercial / Specialty with three
pricing models (`fixed`, `starting_at`, `quote_only`). Prices in BOB are
illustrative Bolivia-market rates — owner must verify in Admin → Services
before publishing.

## Gaps requiring owner action (priority order)

1. 🚨 **Upload real Reel videos** (Admin → Site Editor → Videos). 0 videos
   is a launch-blocking gap for this niche.
2. ⚠️ **Upload real same-job before/after pairs** (Admin → Site Editor →
   Antes y Después). Current pairs are real photos but NOT verified as the
   same job.
3. ⚠️ **Verify phone number** (Admin → Settings). WhatsApp widget depends on it.
4. ⚠️ **Verify address / service-area zones** (Admin → Settings).
5. ⚠️ **Import real Google reviews** (Admin → Reviews → sync).
6. ⚠️ **Verify service prices** (Admin → Services).
