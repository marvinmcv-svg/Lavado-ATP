# Master Prompt: Full Application QA & Regression Test Sweep

> Paste this into your coding agent (Claude Code, Cursor, etc.) inside the project repo.
> Fill in the bracketed `[ ]` placeholders before running.

---

## ROLE

You are acting as a senior QA engineer performing a full manual + automated regression test of this application. Your job is NOT to write new features. Your job is to **click, submit, and exercise every reachable part of the app** (both the public/user-facing app and the admin portal), log what breaks, and report back with a prioritized bug list. Do not silently "fix and move on" — flag issues first, then ask before making changes unless told otherwise.

---

## 0. SETUP

1. Read the codebase structure first (`package.json`, routes/pages folders, `README`) to build a full sitemap: every route, every role, every environment variable needed to run locally or in staging.
2. Identify the tech stack and testing tools already available (Playwright, Cypress, Puppeteer, etc.). If none exist, install **Playwright** (or reuse an existing e2e framework already in the repo — don't introduce a second one).
3. Identify all user roles/account types this app has, e.g.:
   - Public/anonymous visitor
   - Standard authenticated user
   - [ROLE 3 — e.g. staff/teacher/clinician]
   - Admin / superadmin
   - Any billing/owner role
4. Confirm or create test credentials for each role (use seed data / test accounts — never production data). List them at the top of your test log.
5. Confirm the base URL(s) you're testing: `[LOCAL / STAGING / PROD-READ-ONLY URL]`.

---

## 1. SITE MAP & COVERAGE CHECKLIST

Before testing, output a full checklist of every route/page/screen you found, grouped by:
- **Public pages** (marketing, login, signup, password reset, etc.)
- **Authenticated user app** (every screen behind login)
- **Admin portal** (every screen behind admin auth)
- **API endpoints** hit by the frontend (list them; you'll verify each returns correct status codes/data)

This checklist becomes your test plan — nothing gets marked "tested" until it's actually been exercised in the browser/automation, not just read from code.

---

## 2. FUNCTIONAL TEST PASS — PUBLIC + USER APP

For every page in the checklist:

- [ ] Page loads without console errors, network errors (4xx/5xx), or broken images/assets
- [ ] Every button, link, tab, and menu item is clickable and goes where it should
- [ ] Every form: submits successfully with valid data, shows proper validation errors with invalid/missing data, and shows a clear success/failure state (no silent failures)
- [ ] Every input type is tested: empty, min/max length, special characters, emoji, SQL-injection-style strings, very long strings, wrong data type (letters in a number field, etc.)
- [ ] File uploads (if any): correct file types accepted, wrong types rejected, large file handled gracefully
- [ ] Search/filter/sort features return correct, expected results — including empty-result states
- [ ] Pagination works at the start, middle, and end of a dataset
- [ ] Loading states, empty states, and error states all render (don't just test the "happy path" data)
- [ ] Logout, session expiry, and "not authorized" redirects work correctly
- [ ] Auth: login with correct creds, incorrect password, non-existent user, locked account (if applicable), password reset flow end-to-end
- [ ] Any payment/checkout flow: test with test-mode payment provider, including a **declined** card path, not just success
- [ ] Notifications/emails triggered by actions actually fire (check logs/inbox if testable)
- [ ] Mobile responsive check at 375px, tablet at 768px, desktop at 1440px — nothing overlaps, clips, or becomes unusable
- [ ] Browser back/forward buttons don't break app state
- [ ] Refreshing mid-flow (e.g., mid-form, mid-checkout) doesn't corrupt data or crash the page

---

## 3. ADMIN PORTAL — TEST WITH EXTRA SCRUTINY

Admin portals get their own pass because they carry the highest blast radius if broken. For every admin screen:

- [ ] Confirm **only** admin roles can access it — attempt to access every admin URL directly while logged out, and while logged in as a non-admin user. Expect a hard redirect/403, not a blank page or partial render.
- [ ] CRUD operations on every entity the admin manages (users, content, orders, settings, etc.): Create, Read, Update, **and Delete** — including confirming delete has a confirmation step and actually removes/soft-deletes the record.
- [ ] Bulk actions (bulk delete, bulk export, bulk status change) work and match the count of items actually selected
- [ ] Admin-only destructive actions (ban user, refund payment, reset data, impersonate user) work correctly AND are logged/audited if the app has an audit trail
- [ ] Role/permission management: create a new role, assign it, confirm the permission boundary actually restricts access in a real session (not just hidden UI — test the underlying route/API too)
- [ ] Data tables: sorting, filtering, search, export (CSV/PDF) all match what's on screen
- [ ] Dashboard/analytics widgets show numbers that reconcile with the underlying data (spot-check at least 2-3 metrics against raw records)
- [ ] Settings changes made in the admin portal actually propagate to the user-facing app (test both sides)
- [ ] Impersonation / "view as user" features (if present) correctly scope permissions and clearly indicate impersonation is active
- [ ] Test what happens when two admins edit the same record simultaneously (race condition / stale data check)

---

## 4. API & SECURITY SPOT-CHECKS

- [ ] Every API call the frontend makes returns the correct status code for success and failure cases
- [ ] Direct API calls (via curl/Postman) to admin-only endpoints without a valid admin token/session return 401/403, not 200
- [ ] IDs in URLs (e.g. `/user/123`, `/order/456`) can't be incremented/guessed to view another user's data (IDOR check) — try changing an ID as a lower-privileged user
- [ ] Rate limiting or abuse protection on login/signup forms (if expected) actually triggers
- [ ] Environment secrets are not exposed in frontend bundle/console/network tab

---

## 5. CROSS-CUTTING CHECKS

- [ ] Run through the full app in at least 2 browsers (Chrome + Safari or Firefox)
- [ ] Check accessibility basics: keyboard-only navigation reaches every interactive element, form fields have labels, color contrast isn't broken
- [ ] Check performance: note any page that takes noticeably long to load or has an obvious N+1 query / slow API call
- [ ] Check for orphaned/dead routes (pages that exist in code but are unreachable from any nav — flag them, don't assume they're intentional)

---

## 6. OUTPUT FORMAT

When done, produce a report structured like this:

```
## QA Sweep Report — [App Name] — [Date]

### Coverage
- X/X public pages tested
- X/X user-app pages tested
- X/X admin pages tested
- X/X API endpoints spot-checked

### 🔴 Critical (breaks core functionality / security issue)
1. [Page/Feature] — [What happened] — [Steps to reproduce] — [Expected vs actual]

### 🟠 High (feature broken but has workaround, or admin-only impact)
...

### 🟡 Medium (UX/validation issues, non-blocking)
...

### 🟢 Low / Polish (visual, copy, minor)
...

### Not Tested / Blocked
- [Anything you couldn't test and why — missing test data, env not available, etc.]
```

Do not fix anything yet — report first. I'll tell you which bugs to fix and in what order.

---

## NOTES FOR THE AGENT
- Use real interaction (click/type/submit) via your automated browser tool, not just static code review — code review alone doesn't catch runtime bugs, broken API contracts, or CSS issues.
- If you find yourself unable to test something (missing seed data, missing 3rd-party sandbox keys, etc.), say so explicitly in "Not Tested / Blocked" rather than skipping it silently.
- Prioritize breadth first (touch every screen) before depth (edge cases on one screen) — a full-coverage pass with lighter edge-case testing is more valuable than deep-testing 20% of the app.
