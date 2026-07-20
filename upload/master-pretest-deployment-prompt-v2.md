# MASTER PROMPT — Pre-Deployment Full System Test & Audit (v2)

## CHANGELOG — v2
Revised after a critical multi-discipline audit (security, backend, frontend,
architecture). Changes from v1:
- **NEW Phase 0**: hard gate confirming test/prod DB isolation before any
  mutation testing runs, plus secrets-handling rules for the agent itself.
- **Phase 4**: added concurrent-write / race-condition testing (double-booking,
  last-inventory-unit races) and mandatory test-data teardown.
- **Phase 6**: fixed deprecated `npm audit --production` → `--omit=dev`;
  added WhatsApp Business Platform compliance checks (template approval,
  opt-in consent) where applicable.
- **Phase 1**: resolved contradiction between "warnings are logged, not
  blocking" and `--max-warnings=0` (hard fail) — now explicit.
- **Phase 9**: added `noindex` / `X-Robots-Tag` check for admin surfaces.
- **Phase 8/10**: de-duplicated the 44×44px tap-target check (now lives in
  Accessibility only, Cross-Device references it instead of repeating it).
- **NEW Phase 13**: Observability & monitoring — a go/no-go is meaningless if
  nobody finds out the app broke until a client calls.
- **Phase 15 (Final Report)**: now requires a git commit SHA + environment
  fingerprint so the report is traceable to an exact deployable state.

---

## HOW TO USE THIS
Paste this whole document into Claude Code inside the project root. Fill in the
`PARAMETERS` block first — everything downstream reads from it. Do not let the
agent skip a section by claiming it's "not applicable" without printing a
one-line justification in the final report. Silent skipping is how bugs reach
production.

This prompt assumes an agent with actual tool access (bash, file read/write,
browser via Playwright). If the agent can't execute commands, it must say so
up front rather than "simulating" results — a hallucinated test pass is worse
than no test.

---

## PARAMETERS (fill in per project — defaults reflect Marvin's standard stack)

```yaml
stack:
  framework: Next.js 15 (App Router)
  language: TypeScript (strict mode)
  db: Supabase (Postgres)
  orm: Drizzle ORM
  styling: Tailwind + Shadcn/ui
  e2e: Playwright
  host: Vercel
locale:
  primary: es-BO
  secondary: en
  currency: BOB
  commerce_channel: WhatsApp
  whatsapp_tier: "wa_me_link_only | business_platform_api"  # determines whether Phase 6 compliance checks apply
env_files: [.env.local, .env.production]
test_db:
  isolated_from_production: "true | false | unknown"  # if not 'true', Phase 0 blocks Phase 4
  project_ref: "supabase project ref used for test runs — must differ from prod ref"
payment_gateway: "none | stripe | other"  # if not none, treat payment webhooks as their own sub-phase in Phase 4/6
critical_user_flows:
  - "list every purchase/booking/contact flow a real user completes end-to-end"
admin_surfaces:
  - "list every /admin route or portal that mutates data"
out_of_scope: "anything explicitly not built yet — name it so it's not silently skipped"
```

If any parameter is unknown, the agent should inspect the repo (`package.json`,
`drizzle` config, `.env.example`, route tree) rather than ask — only ask if the
critical_user_flows list is genuinely undiscoverable from the code, **or if
`test_db.isolated_from_production` cannot be determined from config alone**
(this one is not worth guessing on — ask).

---

## EXECUTION ORDER (do not reorder — each phase gates the next)

Fast, cheap checks first. No point running a 20-minute E2E suite against code
that doesn't even typecheck. No point running mutation tests against a
database you're not 100% sure is safe to mutate — hence Phase 0 comes before
everything else, not after.

```
0.  Environment safety gate (DB isolation + secrets-handling rules)
1.  Static analysis & build integrity
2.  Type safety
3.  Unit tests
4.  Integration tests (API + DB)
5.  E2E tests (Playwright, real browser)
6.  Security pass
7.  Performance pass
8.  Accessibility pass
9.  SEO & metadata
10. Cross-device / responsive
11. Error-state & edge-case audit
12. Environment & deployment config
13. Observability & monitoring
14. Regression pass against critical_user_flows
15. Final report + go/no-go
```

If any phase fails hard (build doesn't compile, migrations don't apply, DB
isolation can't be confirmed), STOP and report immediately rather than
continuing through the list producing noise on top of a broken foundation.

---

### 0. Environment Safety Gate (NEW — runs before anything else)
This phase exists because integration and E2E tests write to a real database.
Getting this wrong doesn't produce a bug report — it produces deleted or
corrupted client data.

- **DB isolation check (hard blocker):** confirm the Supabase project ref used
  for test runs is *not* the production project ref. Compare
  `test_db.project_ref` against whatever `.env.production` points to. If they
  match, or if this can't be determined with certainty, **STOP** — do not run
  Phase 4 or Phase 5 mutation tests. Report this as the single highest-severity
  blocking finding, ahead of any code-quality issue. A missing staging
  database is common for small single-DB client projects — treat it as a
  project-setup gap to flag to the human, not something to work around by
  testing against prod "carefully."
- **Secrets-handling rule for the agent itself:** the agent will read
  `.env.local` / `.env.production` and grep built output for leaked keys
  (Phase 1, Phase 12). It must never print actual secret values — not in the
  terminal output it summarizes, not in the final report, not in any
  intermediate file it creates. Confirm *presence, absence, and correct
  scoping* (e.g. no service-role key in a `NEXT_PUBLIC_*` var) — never the
  value itself.
- **Tool/network prerequisite check:** confirm the agent actually has the
  access this document assumes — bash execution, file read/write, a real
  browser via Playwright, network egress to the package registry, and DB
  connectivity to the (confirmed-isolated) test instance. If any of these are
  missing, say so now, not at Phase 12 when the clean-clone build fails for
  reasons unrelated to the code.

### 1. Static Analysis & Build Integrity
- `npm run build` (or equivalent) — must complete with zero errors.
- **Warnings policy (previously contradictory — now explicit):** the linter
  gate is the hard fail. Run `eslint . --max-warnings=0` (or the project's
  configured linter) and treat any warning at that step as build-blocking.
  Build-tool warnings that aren't lint findings (e.g. bundler notices) are
  logged and reviewed, not auto-blocking, unless they indicate a real defect.
  Don't let the two policies read as contradictory in the report — state
  explicitly which warnings blocked the build and which were logged-only, and
  why.
- Fix or justify every suppressed rule (`eslint-disable` comments) — a comment
  without a reason is a red flag, not documentation.
- Check for dead code, unused exports, unused Tailwind classes if a purge step
  exists.
- Confirm no `console.log`, debugger statements, or TODO/FIXME markers remain
  in code paths that ship to production.
- Confirm no hardcoded secrets, API keys, or Supabase service-role keys in
  client-side bundles — grep the built output, not just source. (Report
  presence/absence only, per Phase 0's secrets rule — never the value.)

### 2. Type Safety
- `tsc --noEmit` at strict mode. Zero `any` introduced without an inline
  justification comment.
- Drizzle schema types match actual DB schema (run `drizzle-kit check` or
  equivalent drift check) — schema drift between code and live DB is the
  single most common silent-failure cause in this stack.
- Zod (or equivalent) runtime validation exists at every API boundary that
  accepts user input — type safety at compile time is meaningless if the
  runtime accepts garbage from a form or webhook.

### 3. Unit Tests
- Every pure function with business logic (pricing, currency conversion BOB
  handling, date/timezone logic, WhatsApp message formatting) has unit tests.
- Coverage target: 80%+ on `/lib`, `/utils`, `/services` — not a vanity metric
  on the whole repo, UI glue code doesn't need it.
- Explicitly test boundary conditions: empty strings, null/undefined, zero,
  negative numbers, max-length inputs, non-Latin characters (this matters for
  bilingual es/en content).

### 4. Integration Tests (API + Database)
- Every API route: happy path + at least 2 failure paths (bad auth, malformed
  payload, DB unreachable).
- Every Drizzle query that mutates data: test against the *confirmed-isolated*
  test Supabase instance from Phase 0, not a mock — ORM mocks hide real
  constraint violations.
- Foreign key constraints, unique constraints, and cascading deletes actually
  behave as the schema declares — don't assume the migration did what the SQL
  says; run it and check.
- Row-Level Security (RLS) policies: for every table, explicitly test that an
  unauthenticated or wrong-tenant request is REJECTED, not just that the
  correct request is allowed. This is the #1 place Supabase apps leak data
  silently.
- Transactions: confirm partial failures roll back cleanly (e.g., an order
  that fails mid-write doesn't leave an orphaned row).
- **Concurrency / race conditions (NEW):** for any flow with limited capacity
  — a booking slot, a table reservation, last-unit inventory — fire two
  concurrent write requests at the same resource and confirm the *database
  constraint* (unique index, row lock, or serializable transaction) is what
  prevents the double-booking, not just application-layer logic that happens
  to run sequentially in dev. This is the bug that never shows up in manual
  testing and always shows up in week one of production with real concurrent
  users.
- If `payment_gateway` is not `none`: test payment webhook idempotency
  separately — a retried webhook from the provider must not double-charge or
  double-fulfill an order.
- **Test data teardown (NEW):** after this phase, delete or reset any data
  seeded during the run. Repeated audit runs against a persistent test DB will
  otherwise accumulate stale rows and eventually produce false failures in
  unrelated tests.

### 5. End-to-End Tests (Playwright)
- Automate every flow in `critical_user_flows` start to finish, including the
  WhatsApp handoff step where applicable (verify the deep link/URL scheme
  fires correctly, even if you can't automate WhatsApp itself).
- Every admin_surface: full CRUD cycle tested as an authenticated admin.
- Explicitly test what happens when a user double-clicks submit, navigates
  back mid-flow, or refreshes on a payment/booking confirmation step —
  idempotency bugs live here.
- Run the full Playwright suite against at least Chromium + WebKit (covers
  Safari/iOS behavior, which matters heavily for a WhatsApp-first, mobile-
  majority user base).
- Same teardown rule as Phase 4: reset any data this phase creates.

### 6. Security Pass
- Auth: confirm session expiry, token refresh, and logout actually invalidate
  access (not just clear client state).
- Every mutating endpoint checks authorization server-side — never trust a
  hidden form field or client-side role check.
- Input sanitization on anything rendered as HTML (XSS) and anything passed
  to a query (SQLi — Drizzle parameterizes by default, but flag any raw SQL).
- Rate limiting / abuse protection on public forms (contact, booking) and
  WhatsApp trigger endpoints — for this stack, the practical default is
  Upstash Redis + a middleware rate-limiter; if something else is used,
  confirm it's actually wired in, not just planned.
- Dependency audit: `npm audit --omit=dev` (the `--production` flag is
  deprecated and will eventually be removed — use `--omit=dev`). Flag
  high/critical CVEs.
- CORS and environment variable exposure: confirm `NEXT_PUBLIC_*` only
  contains what's genuinely safe to expose client-side.
- **WhatsApp Business Platform compliance (NEW — only if
  `whatsapp_tier: business_platform_api`):** confirm outbound business-initiated
  messages use pre-approved templates, and that opt-in consent is actually
  recorded (not assumed) before automated messages are sent. This is a Meta
  account-suspension risk, not just a UX nicety, and doesn't apply if the
  project only uses simple `wa.me` deep links.

### 7. Performance Pass
- Lighthouse (or equivalent) run on the 3 highest-traffic pages: target
  90+ performance score on mobile throttled 3G/4G profile — your user base is
  mobile-first in Bolivia, don't test only on fast broadband.
- Image optimization: confirm `next/image` (or equivalent) is actually used,
  not raw `<img>` tags with unoptimized assets.
- Bundle size: flag any client bundle over ~200KB gzipped without
  justification; check for accidental full-library imports (e.g. importing
  all of lodash for one function).
- DB query performance: flag any query without an index backing its WHERE/JOIN
  clause, especially on tables expected to grow (orders, leads).

### 8. Accessibility
- Automated pass: axe-core or Playwright's accessibility snapshot on every
  page, targeting **WCAG 2.1 AA** as the explicit standard (name it in the
  report — don't leave the bar undefined).
- Manual spot-check: keyboard-only navigation through the critical_user_flows
  — can a user tab through and complete a booking/order without a mouse?
- Color contrast on custom Tailwind theme colors, not just Shadcn defaults.
- All interactive elements have accessible names (not just visual icons).
- **Tap targets:** all interactive elements meet minimum 44×44px on mobile.
  (This is the canonical home for this check — Phase 10 references it rather
  than re-testing it, to avoid the same finding being reported twice.)

### 9. SEO & Metadata
- Every public page: title, meta description, Open Graph tags, and
  Schema.org JSON-LD where relevant (matches your existing pattern from
  Brasargent) — verify these render server-side, not just client-injected.
- `sitemap.xml` and `robots.txt` present and correct for production domain.
- Canonical URLs correct for bilingual (es/en) routes — duplicate content
  across locales without hreflang is a common SEO leak.
- **Admin surfaces excluded from indexing (NEW):** every route in
  `admin_surfaces` carries `noindex` (via meta tag or `X-Robots-Tag` header).
  An indexed admin login page is a recurring real-world incident, not a
  theoretical one — confirm it explicitly rather than assuming the sitemap
  scope handles it.

### 10. Cross-Device / Responsive
- Test at minimum: 375px (small mobile), 768px (tablet), 1440px (desktop).
- Tap targets: covered in Phase 8 — don't re-run as a separate finding, just
  confirm the Phase 8 result holds across all three breakpoints tested here.
- Test with an actual low-end Android profile if available — significant
  portion of LatAm mobile traffic is not high-end iOS.

### 11. Error-State & Edge-Case Audit
- Every network-dependent action has a visible loading state AND a visible
  error state — no silent failures where a button just does nothing.
- 404 and 500 pages exist, are branded, and don't leak stack traces in
  production.
- Form validation messages are bilingual and specific (not generic "error
  occurred").
- Test with DB temporarily unreachable / API timeout simulated — confirm
  graceful degradation, not a white screen.

### 12. Environment & Deployment Config
- Confirm `.env.production` has every variable `.env.local` has, no
  accidental fallback to dev values (dev Supabase URL leaking into prod build
  is a classic).
- Confirm Vercel environment variables match what the code actually reads —
  a renamed env var in code without updating Vercel dashboard fails silently
  at runtime, not build time.
- Confirm preview deployments don't point at production DB.
- Confirm build works from a clean clone (`git clone` → `npm install` →
  `build`) — catches "works on my machine" dependency drift.
- **Migration rollback path:** confirm a documented or scripted path exists to
  revert the DB to its pre-migration state if a deploy fails partway through.
  Drizzle migrations are forward-only unless down-migrations are written —
  don't assume recoverability, check it.

### 13. Observability & Monitoring (NEW)
A go/no-go decision is incomplete if nobody will know the app broke until a
client calls to ask why their site is down.
- Error tracking (Sentry or equivalent) is wired into both client and server,
  and actually fires a test error successfully — don't just check that the
  SDK is imported.
- Uptime monitoring exists for the production URL and any critical API routes
  (booking confirmation, payment webhook endpoints).
- Confirm someone (Marvin, or the client) actually receives the alert — a
  monitoring dashboard nobody looks at is not monitoring.

### 14. Regression Pass
- Re-run the full critical_user_flows list one final time after all fixes
  from steps 0–13 are applied — fixes in one area regularly break another.

### 15. Final Report
Output a single markdown report with:
- Pass/fail per phase, with specific file:line references for failures, not
  vague descriptions.
- Every skipped check with a one-line justification (per the rule at the top
  of this document — no silent skips).
- A blunt go/no-go recommendation. If the honest answer is "no-go," say that
  plainly with the specific blocking issues ranked by severity — don't soften
  it into "mostly ready with a few minor items" if it isn't.
- A short "known limitations / accepted risk" section for anything shipped
  deliberately imperfect, so it's a documented decision, not a surprise later.
- **Traceability (NEW):** the git commit SHA, Node version, and package
  lockfile hash this report was generated against. A go/no-go verdict that
  can't be tied to an exact code state is not reliably reproducible six months
  later when something breaks and someone asks "was this actually tested?"

---

## GROUND RULES FOR THE AGENT
- Never report a test as "passing" without having actually executed it. If a
  tool/environment limitation prevents execution, say so explicitly.
- Never mutate a database that Phase 0 hasn't confirmed is isolated from
  production, under any circumstances, even if later phases would be faster
  or more thorough by doing so.
- Never print secret values (API keys, service-role keys, tokens) in any
  output — confirm presence, absence, and scoping only.
- Don't pad the report with restated checklist items that have no findings —
  a clean phase gets one line: "Pass — no issues found."
- Flag anything that looks like a workaround/hack left in from earlier
  development, even if it currently "works."
- If critical_user_flows or admin_surfaces weren't filled in, derive them from
  the route tree and state that assumption explicitly at the top of the
  report.
