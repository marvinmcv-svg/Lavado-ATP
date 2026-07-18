# TECH_DECISIONS.md — lavadoatp

Documented deviations from the master-prompt locked tech stack. Per the prompt,
no stack deviation is permitted without a written reason here.

## Environment constraints

The master prompt specifies **Next.js 15 + Supabase + Drizzle ORM + Vercel**.
This build executes in a sandboxed Next.js 16 environment with **Prisma +
SQLite** as the only available persistence layer (no Supabase project, no
external Postgres). The deviations below are forced by the environment, not
by preference.

| Spec requirement                | This build                       | Reason |
|---------------------------------|----------------------------------|--------|
| Next.js 15 App Router           | Next.js 16 App Router            | Sandbox ships Next 16; App Router semantics used unchanged |
| Supabase Auth + Postgres + RLS  | Prisma + SQLite (single-tenant)  | No Supabase project available in sandbox; single-business data lives in SQLite. RLS is moot for single-tenant local DB; role checks enforced at the API layer instead |
| Supabase Realtime               | Client refetch + manual refresh  | No realtime backend in sandbox; admin panels refetch on action. Realtime is a drop-in upgrade path when Supabase is connected |
| Drizzle ORM                     | Prisma Client                    | Prisma is the pre-configured ORM in this sandbox; schema mirrors the spec 1:1 |
| Supabase Storage (media upload) | External URL storage             | `media_url` columns store URLs; admin uploads would write to Supabase Storage in production. Real photos currently sourced from public web image search |
| Next.js Server Actions          | Next.js Route Handlers (`/api`)  | Project convention requires API routes over Server Actions |
| `react-compare-slider`          | Custom slider component          | Library not in the dependency allow-list; built an accessible drag-to-reveal slider with pointer events (same UX, no new dependency) |
| `@hello-pangea/dnd`             | `@dnd-kit` (already installed)   | `@dnd-kit/core` + `@dnd-kit/sortable` are pre-installed in the sandbox; used for service reorder + leads kanban |
| Stripe webhooks                 | Phase 2 (not built)              | Per the prompt, payments are explicitly Phase 2 |
| Playwright E2E suite            | Manual Agent-Browser verification | No Playwright runner in sandbox; end-to-end verification performed via the Agent Browser tool (see final report) |
| Vercel deployment               | `bun run dev` on port 3000       | Sandbox local dev only |

## What is preserved unchanged from the spec

- Bilingual ES/EN with `localStorage` preference and auto-detection (Step 3.8)
- WhatsApp `wa.me` click-to-chat widget — real deep link, not a fake chat UI (Step 3.2)
- Schema.org `HomeAndConstructionBusiness` JSON-LD with NAP + areaServed + openingHours (Step 3.6)
- Three pricing models: `fixed` / `starting_at` / `quote_only` (Step 3.3)
- Before/after drag-to-reveal slider with keyboard + touch support (Step 3.4)
- Quote calculator with admin-editable tier config + WhatsApp handoff + lead capture (Step 3.9)
- Analytics event ingestion (fire-and-forget) for page_view / whatsapp_click / quote_calculator_used / service_section_view (Step 3.10)
- All 10 admin modules (Step 4.1–4.10): Dashboard, Services, Bookings, Customers, Leads Kanban, Analytics, Site Editor, Reviews, Staff, Settings
- Audit log on admin mutations (Step 4.x)
- ZERO-AI-MEDIA rule: no image- or video-generation model is called anywhere. All visuals are real photographs from public web image search; gaps are flagged, not filled (Step 0 ZERO-AI-MEDIA RULE)

## Schema mapping (spec SQL → Prisma)

The Prisma schema in `prisma/schema.prisma` mirrors the spec's
`001_initial.sql` 1:1. SQLite type adaptations: `uuid` → `String @id
@default(cuid())`, `numeric` → `Float`, `jsonb` → `Json`, `text[]` → `Json`
(serialized string arrays). CHECK constraints are enforced at the application
layer (zod schemas in the API routes).

## Single route constraint

The sandbox exposes only the `/` route to the preview. The admin portal is
therefore rendered as a client-side view toggle within the same page (the
"Admin" button in the nav switches `view` state from `"public"` to
`"admin"`), not as a separate `/admin` route. All admin data flows through
`/api/admin/*` route handlers. In a production deploy this maps directly to
the spec's `/admin` route group with no code changes to the API or DB layer.
