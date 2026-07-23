# SkillMark-App — Security & Compliance Audit

**Date:** audit run on current working tree.
**Scope:** `SkillMark-App` (Next.js product) + notes on `SkillMark` (static site).
**Mode:** Report only (Phase 1–3). Remediation applied afterward on explicit approval — see status below.

---

## ✅ Remediation Status (updated after approval)

**Root cause:** the audit ran against a **stale local checkout** (branch reset to
`d0e8e98`, pre-hardening). The real branch tip on the remote
(`origin/claude/view-full-build-KcLOW` @ `f05e701`) already contained the
hardened code, and the deployed Vercel app was built from it. The local branch
was reconciled to the remote (`git reset --hard`), restoring every prior fix,
then the remaining genuinely-open items were implemented.

| Finding | Status |
|---|---|
| CRIT-1 mass assignment | ✅ Fixed (column whitelist in `saveProfileStep` + DB column grants) |
| CRIT-2 supervisor_verifications anon writable | ✅ Fixed (policies dropped, grants revoked) |
| CRIT-3 notifications open INSERT | ✅ Fixed (scoped to `auth.uid() = profile_id`) |
| HIGH-1 unauth `incrementProfileViews` | ✅ Fixed (guarded `SECURITY DEFINER` RPC, owner-excluded) |
| HIGH-2 IP spoofing rate-limit | ✅ Fixed (trusted `x-real-ip` / last XFF hop) |
| HIGH-3 missing `WITH CHECK` | ✅ Fixed (all policies split with `WITH CHECK`) |
| HIGH-4 owner-writable metrics | ✅ Fixed (column UPDATE revoked) |
| MED-1 PostgREST injection | ✅ Fixed (input sanitized in `searchUsers`) |
| MED-2 any-https image URLs | ✅ Fixed (pinned to caller storage prefix) |
| MED-3 upload MIME/size | ⚠️ Requires Supabase bucket config (dashboard) — see ops note |
| MED-4 rate-limit memory | ✅ Fixed (eviction/sweep) |
| MED-5 no throttle on actions | ✅ Fixed (rate limits on send/search) |
| MED-6 trigger search_path/collision | ✅ Fixed (`set search_path` + collision fallback) |
| MED-7 updateWorkExperience assign | ✅ Fixed (whitelist) |
| MED-8 FormData null-safety/email | ✅ Fixed |
| MED-9 dependency CVEs | ✅ Fixed (npm `overrides` → sharp≥0.35, ws≥8.21.1, postcss≥8.5.10; `npm audit` = 0) |
| LOW-1 no password reset | ✅ Fixed (`/forgot-password`, `/reset-password`, `/auth/confirm`) |
| LOW-2 username validation drift | ✅ Fixed (shared rules) |
| LOW-3 HSTS/CSP | ✅ HSTS added (CSP still recommended, deferred) |
| COMP-1 accessibility | ◑ Partial — aria-labels added to icon buttons (nav, messages, menu, carousel); full axe/contrast pass still recommended |
| COMP-2 privacy/terms in app | ✅ Fixed (`/privacy`, `/terms` pages + footer links) |
| COMP-3 policy↔behavior | ✅ Addressed in policy copy |
| COMP-4 account/data deletion | ✅ **Fixed (new)** — `delete_own_account()` SECURITY DEFINER RPC + `deleteAccount` action + Settings "Danger Zone" (type-DELETE confirm); cascades all PII, best-effort storage purge |
| COMP-5 cookie consent | ⏳ Gated (only needed when analytics added) |
| COMP-6 CAN-SPAM | ⏳ Gated (only needed for marketing email) |
| COMP-7 footer disclosures | ✅ Fixed |
| INFO-3 middleware→proxy | ✅ Fixed (`proxy.ts`) |
| COMP-8 PCI / COMP-9 TCPA | N/A (no payments / no calling) |

**Two items still require action outside the codebase (Supabase dashboard):**
1. **Re-run `supabase/schema.sql`** in the SQL Editor so the RLS/policy/function
   changes (including the new `delete_own_account`) take effect on the live DB.
2. **Set bucket limits** (MED-3): `allowed_mime_types: image/*` + `file_size_limit`
   on `avatars`, `banners`, `project-photos`; and add the app URL to
   Auth → Redirect URLs (for password reset).

The original Phase 1–3 findings below are retained as the historical record.

---

> ⚠️ **Critical context — branch state.** The branch `claude/view-full-build-KcLOW`
> is currently checked out at commit `d0e8e98` (working tree clean). This commit
> **predates the prior security-hardening work.** Earlier-hardened files
> (`supabase/schema.sql`, `app/actions/profile.ts`, `lib/rate-limit.ts`,
> `app/actions/messages.ts`, upload/URL validation, password-reset flow, HSTS)
> are back in their **original vulnerable state** on disk. Every finding below
> reflects what is actually in the current checkout — not an earlier version.
> If hardened versions exist on the remote or another branch, the first
> remediation step is to reconcile branches so the deployed code is the fixed code.

---

## Phase 1 — Architecture Summary

**Stack**
- Next.js **16.2.6** (App Router, Turbopack), React, TypeScript, Tailwind v4.
- **Supabase**: Auth (email/password), Postgres + Row-Level Security, Storage
  (`avatars`, `banners`, `project-photos` buckets), Realtime (messages).
- Hosting: Vercel (two projects: `skill-mark-app`, `next.js.skillmark`).
- Static marketing site (`SkillMark/index.html`) posts the waitlist to Formspree
  (`FORMSPREE_ID = xrejekgk`).

**Trust model (important):** Every server action and the one API route use
`createClient()` from `lib/supabase/server.ts`, which uses the **anon key only**.
**No service-role key exists anywhere in the codebase or client bundle** — good.
This means **Postgres RLS is the actual server-side enforcement layer**; the
`.eq("profile_id", user.id)` filters in actions are defense-in-depth. The
consequence: wherever RLS is permissive (see CRIT-2, CRIT-3, HIGH-3), the app
code cannot save you, and wherever an action forwards a raw client object to
`.update()` (CRIT-1), RLS permits it because the row belongs to the user.

**Routes / entry points**
- Pages: `/`, `/login`, `/signup`, `/onboarding`, `/dashboard`, `/[username]`,
  `/search`, `/messages`, `/settings`, `/projects`, `/projects/new`,
  `/projects/[id]`, `/projects/[id]/edit`.
- API: `GET /api/check-username`.
- Server Actions: `actions/auth.ts` (signup/login/logout),
  `actions/profile.ts`, `actions/projects.ts`, `actions/messages.ts`,
  `actions/certifications.ts`, `actions/upload.ts`.
- `middleware.ts` guards `/dashboard,/onboarding,/projects,/settings,/messages,/search`.

**Data models:** `profiles`, `work_experience`, `projects`, `project_photos`,
`certifications`, `supervisor_verifications` (legacy), `messages`,
`notifications`.

**Third-party services:** Supabase, Vercel, Formspree (static site only).

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(both public by design; anon key is not a secret). No committed `.env`
(`.gitignore` excludes `.env*`), no secrets found in tracked files.

**Where user input enters:** server-action arguments (fully attacker-controlled
JSON — a server action is a POST endpoint), `FormData` fields, the
`check-username` query param, message `content`, the user `search` query, and
uploaded files.

---

## Phase 2 — Security Findings

### [CRIT-1] Mass assignment in `saveProfileStep` lets a user rewrite any column of their own profile
- **Severity:** Critical
- **Category:** Security
- **Location:** `app/actions/profile.ts:20-43` (esp. line 38 `.update(data)`); RLS `supabase/schema.sql:38-39`
- **Description:** The action forwards the raw, attacker-controlled `data` object straight into `.update(data)`. `ProfileUpdate` is a TypeScript type and is erased at runtime, so it enforces nothing. The RLS update policy is `using (auth.uid() = id)` with **no `WITH CHECK` and no column restriction**.
- **Impact:** A caller (server actions are POST endpoints) can set **any column of their own `profiles` row**: `profile_views`/`verified_project_count` (vanity/trust inflation shown publicly), `onboarding_complete`, and critically **`username`** — bypassing all signup validation to claim `"admin"`, unicode look-alikes, or oversized values (impersonation). Also `avatar_url`/`banner_url` bypassing the weak URL check.
- **Recommended fix:** Build an explicit whitelist object server-side and pass only allowed keys to `.update()`; add a DB `CHECK` on `username` and `WITH CHECK` on the profiles UPDATE policy; revoke column-level UPDATE on `profile_views`/`verified_project_count`/`username`.
- **Effort:** Small

### [CRIT-2] `supervisor_verifications` is anonymously readable, insertable, and updatable
- **Severity:** Critical
- **Category:** Security
- **Location:** `supabase/schema.sql:179-186`
- **Description:** Three policies (`Anyone can read/insert/update verifications`) have no `to authenticated` clause, so they apply to the **`anon` role**. Insert uses `with check (true)`; update uses `using (true)` with no `WITH CHECK`.
- **Impact:** Anyone holding the public anon key (i.e. anyone on the internet) can insert unlimited rows (storage/cost abuse) and **UPDATE every column of every row** in the table, and can SELECT the `token` column that was designed to be a secret capability. The feature is dead code per project docs, making this pure attack surface.
- **Recommended fix:** Drop the three policies and `revoke all on supervisor_verifications from anon, authenticated;` (RLS stays enabled → default deny). Consider dropping the table entirely.
- **Effort:** Trivial

### [CRIT-3] `notifications` INSERT policy allows injecting notifications into any user's feed
- **Severity:** Critical
- **Category:** Security
- **Location:** `supabase/schema.sql:235-236` (`"System can insert notifications" ... with check (true)`)
- **Description:** Despite the name, the policy is not scoped to a service role (service role bypasses RLS and needs no policy). As written, any anon/authenticated caller can insert a notification row with an **arbitrary `profile_id`, `title`, `body`, and `link`**.
- **Impact:** Phishing / spam vector — an attacker can plant attacker-controlled links in any victim's notification feed once notification UI ships. Also unbounded row insertion.
- **Recommended fix:** Drop the policy; replace with `for insert to authenticated with check (auth.uid() = profile_id)`. Let the service role (RLS-exempt) write true system notifications.
- **Effort:** Trivial

### [HIGH-1] `incrementProfileViews` is unauthenticated and unvalidated
- **Severity:** High
- **Category:** Security
- **Location:** `app/actions/profile.ts:143-146`
- **Description:** This server action performs **no `getUser()` check, no owner check, and no rate limit**, and calls RPC `increment_profile_views({ profile_id })`. (Note: no such function is defined in `supabase/schema.sql`, so the call likely errors silently today — but the missing guard is the security issue.)
- **Impact:** Anyone can call this endpoint repeatedly with any `profileId` to arbitrarily inflate or manipulate any profile's public view count — a manipulable trust/vanity metric — and hammer the DB. If the RPC is later added without its own guard, this is fully exploitable.
- **Recommended fix:** Require an authenticated user, ignore self-views, rate-limit per user, and make the RPC a `SECURITY DEFINER` function that only increments (never sets) and excludes the owner.
- **Effort:** Trivial

### [HIGH-2] Rate-limit key is derived from a client-spoofable header
- **Severity:** High
- **Category:** Security
- **Location:** `app/actions/auth.ts:10-14`; `app/api/check-username/route.ts:6-9`
- **Description:** `getIp()` takes the **leftmost** value of `x-forwarded-for`, which the client fully controls. An attacker sends a random `X-Forwarded-For` on each request and gets a unique rate-limit bucket every time.
- **Impact:** The login (10/min), signup (5/min), and username-enumeration (30/min) limits are **completely bypassable**, neutralizing brute-force and credential-stuffing protection on `login`.
- **Recommended fix:** Derive the client IP from a trusted source — on Vercel use the platform-provided connecting IP, or take the **last** XFF hop after the known proxy count. Never trust the leftmost XFF value.
- **Effort:** Small

### [HIGH-3] All UPDATE / `FOR ALL` RLS policies lack `WITH CHECK` — rows can be re-parented and messages rewritten
- **Severity:** High
- **Category:** Security
- **Location:** `supabase/schema.sql:39, 90, 121, 140, 162, 210, 239`
- **Description:** An UPDATE policy with only `using(...)` validates the **old** row, not the **new** one. `work_experience`/`projects`/`certifications`/`project_photos` use `for all using (auth.uid() = profile_id)` with no `WITH CHECK`; `messages` recipient-update (line 210) is `using (auth.uid() = recipient_id)` with no column restriction.
- **Impact:** A user can `UPDATE ... SET profile_id = <victim>` to graft their own project/cert/work-experience row onto another user's profile. A message **recipient can rewrite the `content` and `sender_id`** of a delivered message (falsify what the sender said) or move it to another recipient.
- **Recommended fix:** Split `FOR ALL` into explicit insert/update/delete policies each with matching `WITH CHECK (auth.uid() = profile_id)`; restrict message UPDATE to `read_at` only via column-level grant + `WITH CHECK`.
- **Effort:** Small

### [HIGH-4] Public trust metrics are owner-writable (`profile_views`, `verified_project_count`)
- **Severity:** High
- **Category:** Security
- **Location:** `supabase/schema.sql:23-24, 38-39` (overlaps CRIT-1)
- **Description:** RLS lets the owner update any column of their own row, including the two counters rendered publicly.
- **Impact:** A worker can set `profile_views`/`verified_project_count` to any number, faking credibility signals contractors see.
- **Recommended fix:** `revoke update (profile_views, verified_project_count) on profiles from anon, authenticated;` and mutate only via SECURITY DEFINER RPC.
- **Effort:** Trivial

### [MED-1] PostgREST filter injection in `searchUsers`
- **Severity:** Medium
- **Category:** Security
- **Location:** `app/actions/messages.ts:50`
- **Description:** User input `q` is interpolated raw into `.or(\`username.ilike.%${q}%,full_name.ilike.%${q}%\`)`. Characters with meaning in PostgREST filter grammar (`,` `(` `)` `.`) and LIKE wildcards (`%` `_`) let a caller break out of the `ilike` value.
- **Impact:** Crafted filters / error-based enumeration / broken search results (e.g. a comma or parenthesis in a name corrupts the query). Blast radius is limited because `profiles` is public-read, but it is a genuine injection primitive and a functional bug.
- **Recommended fix:** Strip PostgREST metacharacters and LIKE wildcards from `q` before interpolation, or use per-column `.ilike()` / `.textSearch()`.
- **Effort:** Small

### [MED-2] Stored image URLs accept any `https://` URL (weak IDOR/SSRF-ish validation)
- **Severity:** Medium
- **Category:** Security
- **Location:** `app/actions/profile.ts:73,83`; `app/actions/projects.ts:88,119,133`
- **Description:** `saveAvatarUrl`/`saveBannerUrl`/`saveProject*Photo` only check `url.startsWith("https://")`. The URL is otherwise unconstrained.
- **Impact:** `avatar_url`/`banner_url`/photo URLs can point at **any** external https resource (off-platform tracking pixel, or an HTML/JS file uploaded to the user's own storage path and served with its stored content-type from the Supabase domain). Renders arbitrary third-party content in the app's image slots.
- **Recommended fix:** Require the saved URL to begin with the expected `SUPABASE_URL/storage/v1/object/public/<bucket>/<user.id>/` prefix.
- **Effort:** Small

### [MED-3] Signed upload URLs enforce no content-type or size limit server-side
- **Severity:** Medium
- **Category:** Security
- **Location:** `app/actions/upload.ts` (all `createSignedUploadUrl` calls, `upsert:true`)
- **Description:** No server-side MIME or size restriction; enforcement depends entirely on Supabase bucket configuration, which is not verifiable from the repo.
- **Impact:** A user can upload arbitrary content types (e.g. HTML/JS) or very large files to their own path → combined with MED-2, arbitrary content served from the Supabase domain; storage-cost abuse.
- **Recommended fix:** Configure `allowed_mime_types: image/*` and a `file_size_limit` on all three buckets (Supabase dashboard); optionally validate client-side too.
- **Effort:** Small (config)

### [MED-4] In-memory rate-limit store never evicts → memory-exhaustion DoS
- **Severity:** Medium
- **Category:** Security
- **Location:** `lib/rate-limit.ts:1-13`
- **Description:** Entries are only overwritten when the same key recurs; expired entries are never deleted. Combined with HIGH-2 (attacker supplies unique IPs), each request creates a permanent Map entry. Also per-serverless-instance, so limits are inconsistent.
- **Impact:** Unbounded memory growth / DoS on the serverless instance; weak, inconsistent limiting generally.
- **Recommended fix:** Use a shared store (Upstash/Redis) or at minimum sweep expired entries and cap Map size.
- **Effort:** Small

### [MED-5] No rate limiting on expensive / abusable actions
- **Severity:** Medium
- **Category:** Security
- **Location:** `app/actions/messages.ts:5` (`sendMessage`), `:38` (`searchUsers`); `app/actions/upload.ts` (all); `app/actions/profile.ts:143` (`incrementProfileViews`)
- **Description:** Only `signup`/`login`/`check-username` are throttled. Message sending, user search, upload-URL issuance, and view-increment are unthrottled.
- **Impact:** Message spam/flooding to any user; search/upload abuse.
- **Recommended fix:** Apply `checkRateLimit` keyed on `user.id` to these actions (after fixing MED-4/HIGH-2).
- **Effort:** Small

### [MED-6] `handle_new_user` trigger: no `search_path` pinning; username collision aborts signup
- **Severity:** Medium
- **Category:** Security
- **Location:** `supabase/schema.sql:50-66`
- **Description:** The trigger is `SECURITY DEFINER` with **no `set search_path`** (standard Supabase hardening against search-path hijacking). It inserts into `profiles` whose `username` is `unique not null`; a duplicate username in signup metadata raises a unique-violation inside the `auth.users` insert transaction, rolling back the whole signup with an opaque 500 (TOCTOU with `check-username`).
- **Impact:** Search-path hijack risk if a malicious object is created earlier on the path; broken signup UX under username races.
- **Recommended fix:** Add `set search_path = public, pg_temp`; wrap the insert with `on conflict` / exception handling to fall back to a unique placeholder username.
- **Effort:** Small

### [MED-7] Mass-assignment pattern in `updateWorkExperience`
- **Severity:** Medium
- **Category:** Security
- **Location:** `app/actions/profile.ts:136`
- **Description:** `.update({ ...data, profile_id: user.id })` spreads the raw client object. Scoped by `.eq("id").eq("profile_id", user.id)` so cross-user writes are blocked, but non-whitelisted fields in `data` flow to the DB.
- **Impact:** Limited (own row only), but a caller could set unintended columns (e.g. `created_at`). Same anti-pattern as CRIT-1.
- **Recommended fix:** Whitelist the columns explicitly.
- **Effort:** Trivial

### [MED-8] Unvalidated input / non-null-safe FormData reads
- **Severity:** Medium
- **Category:** Security
- **Location:** `app/actions/auth.ts:24-27` (`formData.get("email") as string`, no email validation); `app/actions/projects.ts:7`
- **Description:** `formData.get(...) as string` throws a `TypeError` (500) if the field is absent, and `email` is never validated server-side before `signUp`.
- **Impact:** Unhandled-error / availability nit; malformed emails reach the auth provider.
- **Recommended fix:** Null-check `FormData` reads and validate email server-side.
- **Effort:** Trivial

### [MED-9] Dependency CVEs (transitive via Next.js)
- **Severity:** Medium (individual CVEs rated High by npm; exposure is transitive)
- **Category:** Security
- **Location:** `package-lock.json` — `sharp <0.35.0` (High, libvips CVE-2026-33327/33328/35590/35591), `ws 8.0.0–8.20.1` (High, memory-exhaustion DoS), `postcss <8.5.10` (Moderate, XSS in CSS stringify)
- **Description:** `npm audit` reports 4 vulns (3 High, 1 Moderate), all transitive dependencies of `next`. `sharp` powers server-side image optimization (processes remote Supabase images — some real exposure); `ws` and `postcss` have lower direct exposure in this app.
- **Impact:** Image-processing memory/DoS and CSS-stringify XSS in the worst case.
- **Recommended fix:** `npm audit fix` (patches available); re-test the build.
- **Effort:** Trivial

### [LOW-1] No password-reset flow (and no account deletion)
- **Severity:** Low (security) / see COMP-4 for compliance angle
- **Category:** Security
- **Location:** app-wide — no `/forgot-password`, `/reset-password`, or `resetPasswordForEmail` call; no "Forgot password?" link on `app/login/page.tsx`
- **Description:** A forgotten password is a permanent lockout; there is no self-serve recovery.
- **Impact:** Account-lifecycle gap; drives support load and account abandonment.
- **Recommended fix:** Add `resetPasswordForEmail` + a confirm route + update-password page; link from login.
- **Effort:** Medium

### [LOW-2] Username validation inconsistent between signup and check-username
- **Severity:** Low
- **Category:** Security
- **Location:** `app/actions/auth.ts:43` (`/^[a-z0-9_-]+$/`, max 30) vs `app/api/check-username/route.ts:20` (`/^[a-z0-9_]+$/`, no hyphen, no max length)
- **Description:** Hyphenated usernames pass signup but are reported invalid by the availability check; check-username also lacks the 30-char cap.
- **Impact:** UX/logic inconsistency; minor.
- **Recommended fix:** Share one validation regex/helper.
- **Effort:** Trivial

### [LOW-3] Missing HSTS (and no CSP)
- **Severity:** Low
- **Category:** Security
- **Location:** `next.config.ts:10-23`
- **Description:** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` are set. **No `Strict-Transport-Security`** and no `Content-Security-Policy`.
- **Impact:** Missing transport hardening (SSL-strip window) and defense-in-depth against injected content.
- **Recommended fix:** Add `Strict-Transport-Security: max-age=63072000; includeSubDomains`; consider a CSP.
- **Effort:** Trivial (HSTS) / Medium (CSP)

### [INFO-1] CSRF posture
- **Category:** Security
- Next.js server actions include built-in origin verification and per-action IDs, and Supabase auth cookies are `SameSite`. No additional CSRF token needed for the current design. Documented for completeness.

### [INFO-2] XSS posture
- **Category:** Security
- No `dangerouslySetInnerHTML` anywhere in `app/`/`components/`; React auto-escapes all rendered user content. No stored-XSS sink found. A CSP (LOW-3) would add defense-in-depth.

### [INFO-3] Next.js `middleware.ts` deprecation
- **Category:** Security (hygiene)
- Next 16 renamed the convention to `proxy.ts`; `middleware.ts` triggers a build deprecation warning. Not a vulnerability.

---

## Phase 3 — Compliance Findings

### [COMP-1] Accessibility — WCAG 2.2 AA / ADA Title III exposure
- **Severity:** High
- **Category:** Compliance
- **Location:** app-wide; concrete spots: `app/dashboard/FeedClient.tsx` carousel arrows and dot buttons (icon/empty buttons, **no `aria-label`**), message send button, avatar/nav icon buttons; `text-dim (#6b7a99)` on light backgrounds (contrast near the 4.5:1 threshold — needs measurement); no visible skip-link; modal focus-trap unverified.
- **Description:** Icon-only and empty `<button>`s without accessible names, potential contrast failures, and unverified keyboard/focus handling are the exact issues cited in ADA Title III web-accessibility demand letters — the **#1 litigation risk for small-business sites**.
- **Impact:** A plaintiff could file an ADA Title III / state (e.g. California Unruh) accessibility claim; these frequently settle in the $5–20k range regardless of merit.
- **Recommended fix:** Run axe-core / Lighthouse; add `aria-label`s to all icon/empty buttons, verify AA contrast, add a skip-link, ensure modals trap and restore focus. This needs a live automated + manual pass to fully enumerate.
- **Effort:** Medium

### [COMP-2] No privacy policy in the app + dead footer link
- **Severity:** High
- **Category:** Compliance
- **Location:** `app/page.tsx:332` (`<a href="#">Privacy</a>`); no `app/privacy` or `app/terms` route exists.
- **Description:** The product app has **no privacy policy or terms page and a dead Privacy link**. (The separate static marketing site *does* ship `privacy.html`/`terms.html`, but the app that collects the PII does not link them.) PII collected: email, name, city/state, job photos, messages.
- **Impact:** **Texas TDPSA** (effective July 1, 2024 — notably has *no* revenue/threshold floor for controllers that process personal data) requires a **conspicuous privacy notice**; **CCPA/CPRA** applies if any California users; **GDPR** if any EU traffic. Missing/again-inaccessible notice is a direct violation and undercuts the "your data is yours" brand promise.
- **Recommended fix:** Add `/privacy` and `/terms` routes to the app (can adapt the static-site copy), disclose Supabase/Vercel/Formspree processors and that profiles are public; fix the footer link; link from signup.
- **Effort:** Small

### [COMP-3] Privacy policy ↔ actual behavior must be reconciled
- **Severity:** Medium
- **Category:** Compliance
- **Location:** policy content (static site + future app page)
- **Description:** Any published policy must accurately state: profiles/photos/work history are **publicly readable**; processors are Supabase (auth/DB/storage), Vercel (hosting), Formspree (waitlist); messages are stored.
- **Impact:** A policy that misstates behavior is itself a deceptive-practices exposure (FTC / state AG).
- **Recommended fix:** Align policy wording with the data flows enumerated in Phase 1.
- **Effort:** Small

### [COMP-4] No account/data deletion or access mechanism
- **Severity:** Medium
- **Category:** Compliance
- **Location:** app-wide (no self-serve deletion; `settings` has no delete)
- **Description:** TDPSA, CPRA, and GDPR grant data-subject **deletion and access** rights. There is no self-serve path and no documented manual process.
- **Impact:** Inability to honor a verified deletion/access request is a statutory violation once the app has real users.
- **Recommended fix:** Add account deletion (cascade DB rows + purge storage) and a documented access/export process; state the contact method in the policy.
- **Effort:** Medium

### [COMP-5] Cookie / tracking consent — currently OK, gate before adding analytics
- **Severity:** Medium (pre-emptive)
- **Category:** Compliance
- **Location:** app-wide
- **Description:** Today only **essential** Supabase auth cookies are used (consent-exempt), so no banner is required **now**. The roadmap adds PostHog/analytics.
- **Impact:** Adding analytics/tracking without a consent/opt-out mechanism would breach GDPR/ePrivacy (EU) and CPRA opt-out (CA).
- **Recommended fix:** Before shipping any non-essential tracking, add a consent banner (EU) and a "Do Not Sell/Share" opt-out (CA).
- **Effort:** Medium (only when triggered)

### [COMP-6] CAN-SPAM — gate before any marketing email
- **Severity:** Low
- **Category:** Compliance
- **Location:** email flows
- **Description:** Supabase transactional auth emails are exempt. The waitlist (Formspree) feeds future marketing sends.
- **Impact:** Marketing emails without a working unsubscribe, valid physical postal address, and accurate headers violate CAN-SPAM ($$ per-email penalties).
- **Recommended fix:** When marketing sends begin, include unsubscribe + postal address + honest From/Subject.
- **Effort:** Small (when triggered)

### [COMP-7] Footer disclosures in the app
- **Severity:** Low
- **Category:** Compliance
- **Location:** app pages / `app/page.tsx` footer
- **Description:** The app lacks visible privacy, terms, contact, and copyright disclosures (the dead Privacy link is the only attempt).
- **Impact:** Missing standard disclosures; compounds COMP-2.
- **Recommended fix:** Add footer links to privacy/terms/contact + copyright once those pages exist.
- **Effort:** Trivial

### [COMP-8] PCI-DSS — out of scope now
- **Severity:** Info
- **Category:** Compliance
- No payments in the app. When Stripe is added (roadmap Q3), stay in **SAQ-A** by using Stripe Checkout/Elements so card data never touches your servers; verify webhook signatures.

### [COMP-9] TCPA — not applicable now
- **Severity:** Info
- **Category:** Compliance
- No outbound calling/SMS. Note if lead-calling/texting is ever added.

---

## Summary Table

| ID | Title | Severity | Category | Effort |
|----|-------|----------|----------|--------|
| CRIT-1 | Mass assignment in `saveProfileStep` (username/metrics/flags) | Critical | Security | Small |
| CRIT-2 | `supervisor_verifications` anon read/insert/update | Critical | Security | Trivial |
| CRIT-3 | `notifications` INSERT open to anyone (feed injection) | Critical | Security | Trivial |
| HIGH-1 | `incrementProfileViews` unauthenticated & unvalidated | High | Security | Trivial |
| HIGH-2 | Rate-limit key from spoofable `X-Forwarded-For` | High | Security | Small |
| HIGH-3 | Missing `WITH CHECK` on UPDATE/`FOR ALL` policies (re-parent, msg tamper) | High | Security | Small |
| HIGH-4 | Public trust metrics owner-writable | High | Security | Trivial |
| COMP-1 | Accessibility / ADA Title III exposure | High | Compliance | Medium |
| COMP-2 | No privacy policy in app + dead footer link (TDPSA/CCPA) | High | Compliance | Small |
| MED-1 | PostgREST filter injection in `searchUsers` | Medium | Security | Small |
| MED-2 | Stored image URLs accept any `https://` URL | Medium | Security | Small |
| MED-3 | No content-type/size limit on signed upload URLs | Medium | Security | Small |
| MED-4 | In-memory rate-limit store never evicts (DoS) | Medium | Security | Small |
| MED-5 | No rate limiting on sendMessage/search/upload/views | Medium | Security | Small |
| MED-6 | `handle_new_user` no `search_path`; username-race aborts signup | Medium | Security | Small |
| MED-7 | Mass-assignment pattern in `updateWorkExperience` | Medium | Security | Trivial |
| MED-8 | Non-null-safe FormData; no server email validation | Medium | Security | Trivial |
| MED-9 | Dependency CVEs (sharp/ws High, postcss Moderate) | Medium | Security | Trivial |
| COMP-3 | Privacy policy ↔ behavior reconciliation | Medium | Compliance | Small |
| COMP-4 | No account/data deletion or access mechanism | Medium | Compliance | Medium |
| COMP-5 | Cookie/consent — gate before analytics | Medium | Compliance | Medium |
| LOW-1 | No password-reset flow | Low | Security | Medium |
| LOW-2 | Username validation inconsistency | Low | Security | Trivial |
| LOW-3 | Missing HSTS (and no CSP) | Low | Security | Trivial |
| COMP-6 | CAN-SPAM — gate before marketing email | Low | Compliance | Small |
| COMP-7 | App footer disclosures | Low | Compliance | Trivial |
| INFO-1 | CSRF posture (acceptable) | Info | Security | — |
| INFO-2 | XSS posture (no sinks found) | Info | Security | — |
| INFO-3 | `middleware.ts` → `proxy.ts` (Next 16) | Info | Security | Trivial |
| COMP-8 | PCI-DSS (out of scope until Stripe) | Info | Compliance | — |
| COMP-9 | TCPA (not applicable) | Info | Compliance | — |

**Totals:** 3 Critical · 6 High · 12 Medium · 6 Low · 5 Info.

---

## Prioritized Top-10 Remediation Order

Ordered by (impact × ease). The first four are internet-exploitable with the
public anon key and mostly trivial to close.

1. **CRIT-2** — Drop `supervisor_verifications` anon policies + revoke grants. *(Trivial, closes anon write access.)*
2. **CRIT-3** — Scope `notifications` INSERT to `auth.uid() = profile_id`. *(Trivial, closes feed-injection/phishing.)*
3. **CRIT-1** — Whitelist columns in `saveProfileStep`; lock `username`/metrics via column grants + `WITH CHECK`. *(Small, stops impersonation + trust-metric forgery.)*
4. **HIGH-1** — Add auth + owner check + rate limit to `incrementProfileViews` (and its RPC). *(Trivial.)*
5. **HIGH-3 / HIGH-4** — Add `WITH CHECK` to every UPDATE/`FOR ALL` policy; split them; revoke column UPDATE on counters and on message `content`/`sender_id`. *(Small, one schema pass.)*
6. **HIGH-2 + MED-4** — Trust-source IP for rate limiting + evict/shared store. *(Small, restores brute-force protection.)*
7. **COMP-2 (+COMP-3/COMP-7)** — Ship `/privacy` + `/terms` in the app, fix the dead link, reconcile wording. *(Small, closes TDPSA/CCPA gap.)*
8. **MED-9** — `npm audit fix` the sharp/ws/postcss CVEs; rebuild. *(Trivial.)*
9. **MED-1 / MED-2 / MED-3** — Sanitize search input; pin stored URLs to own storage prefix; set bucket MIME/size limits. *(Small.)*
10. **COMP-1** — Run an axe/Lighthouse accessibility pass and fix aria-labels/contrast/focus. *(Medium; highest litigation-risk compliance item.)*

**Cross-cutting first step:** reconcile the branch — confirm whether hardened
versions of these files exist elsewhere and get the deployed branch onto the
fixed code, so remediation isn't duplicated or lost.

---

*End of report. No changes were made. Awaiting approval on which items to fix.*
