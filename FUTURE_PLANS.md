# SkillMark — Future Plans, Strategy & Roadmap

*A deep-dive on how to make SkillMark work: where it stands, what to build next,
how to launch, and honest advice. Written July 2026.*

---

## 1. Where We Are Today

**The product is functionally complete for a v1.** After the security audit and
production-readiness passes, SkillMark has:

- Full auth (signup, login, password reset, rate limiting, 8-char minimums)
- Onboarding → profile → projects with photos (cover/before/after)
- A social feed of recent work, search with real filters, real-time messaging
- Work history and certifications management
- Mobile bottom navigation, loading skeletons, SEO/OpenGraph metadata
- Hardened RLS policies, column-level grants, legal pages
- A marketing site (joinskillmark.com) collecting waitlist signups

**What this is:** a portable, photo-first career profile for tradespeople, and a
search tool for the contractors who want to find them.

**What this is not yet:** a marketplace with liquidity. That's the entire game
from here. Everything below is in service of one question: *how do you get
enough workers posting real work in one place that a contractor's search
returns someone worth calling?*

---

## 2. The Core Strategic Problem: Cold Start

SkillMark is a two-sided network. Every two-sided network dies the same way:
side A shows up, finds nobody from side B, and never comes back.

### The asymmetry that works in your favor

Workers get value **before** contractors ever arrive. A SkillMark profile is
useful as:
- A link in a Facebook Marketplace / Craigslist services ad
- Something to text a GC instead of a resume
- A portfolio to show at an interview or union hall
- A permanent record when they change employers (the mission statement)

This means the right sequencing is **workers first, single-player value first**.
Do not pitch contractors until search returns real results. A contractor who
searches "Electrician, Waco, TX" and gets zero results is burned permanently; a
worker with an empty feed still got a portfolio page out of it.

### Go narrow, not wide

The classic mistake is launching "for the trades" nationally. 500 workers
spread across the US is nothing; 500 workers in one metro is a functioning
network. The copy already anchors on Waco, TX — commit to it (or whichever
metro you actually have relationships in).

**Pick: one metro + two trades.** Electrical and HVAC are the best wedges —
license-heavy (credentials matter), photo-friendly (panel work photographs
well), chronically short-staffed. Own "the place to find electricians in
Central Texas" before being anything else.

---

## 3. Launch Plan — 30 / 60 / 90 Days

### Days 0–30: Seed supply by hand (do things that don't scale)

1. **Complete the ops checklist** (Section 7) — Supabase config, custom domain,
   analytics, error monitoring. Half a day of work; do it before inviting anyone.
2. **Recruit 25 founding workers personally.** Not with ads — texts, job-site
   visits, trade-school instructors, one union hall. Offer to *build their
   profile for them*: sit with them for 20 minutes, upload 3–5 photos from
   their camera roll, write the headline. A hand-built profile is your best
   onboarding research and your best marketing asset.
3. **Founding-member framing.** First 100 workers get a "Founding Member"
   distinction (a badge, permanent free status, whatever). People join early
   for status, not features.
4. **Post daily.** The feed must never look dead. Seed it yourself: repost
   (with permission) great trade work, feature a "project of the week."

### Days 30–60: Make profiles travel

The growth loop is **profiles shared outside the platform**:
- Every profile needs a great OG card (done) and a *dead-simple share action* —
  "Copy profile link" / share-sheet button on own profile (small build).
- QR-code business card generator: workers hand a card at job sites; the QR is
  their profile. Cheap to build, physical-world native, and tradespeople
  actually use business cards.
- Ask every founding member: "text your profile to one foreman you've worked
  for." That foreman is your first contractor lead.

### Days 60–90: Turn on the demand side, carefully

- Personally onboard 5–10 contractors/GCs in the metro. Walk them through
  search. Watch where they hesitate — that's the v1.1 roadmap.
- Add the **contractor-intent features** (Section 4, Phase 2): saved
  searches, "available for work" filters surfaced harder, and a structured way
  to reach out (the messaging exists; the *reason to message* needs framing —
  e.g., an "Interested in hiring" quick-action that pre-fills a message).
- Measure the only number that matters at this stage: **worker-initiated
  contact events per week** (messages from contractors to workers). Not
  signups. Signups are vanity; conversations are liquidity.

---

## 4. Product Roadmap (Phased)

### Phase 1 — Launch blockers (build before real users arrive)

| Feature | Why | Size |
|---|---|---|
| **Account deletion** | Privacy policy promises it; GDPR/CCPA basics; app-store requirement if you ever wrap it | S |
| **Client-side image compression before upload** | Job-site photos are 4–12 MB HEIC/JPEG on modern phones; 5MB limit + slow uploads on LTE will silently kill the core loop. Compress/resize in-browser (e.g. `browser-image-compression`, target ~1600px / <1MB) | S–M |
| **Report/block users** | The moment messaging is open, you need a spam/harassment valve. Report button + blocked_users table + filter in messaging | M |
| **Email deliverability** | Configure custom SMTP (Resend/Postmark) in Supabase Auth with your domain + SPF/DKIM. Default Supabase email has strict rate limits and lands in spam — broken confirmation emails = broken signups | S (config) |
| **Storage bucket limits** | `allowed_mime_types: image/*`, `file_size_limit` on all three buckets (dashboard config; currently unenforced server-side) | S (config) |

### Phase 2 — Liquidity features (make search → contact work)

| Feature | Why | Size |
|---|---|---|
| **Notifications UI** | Table + policies already exist. Start with in-app only: "X messaged you", "your project was viewed N times this week." The weekly-views one is a retention hook | M |
| **Email digests** | "3 contractors viewed your profile this week" is the single best re-engagement email a network can send. Needs a cron (Vercel cron / Supabase edge function) + the custom SMTP above | M |
| **Multi-photo projects** | `project_photos` table exists unused. Cover/before/after (3 max) is limiting for real jobs; 10-photo galleries make profiles dramatically richer. Wire table → upload UI → carousel | M–L |
| **Contractor quick-contact** | "Interested in hiring" button on profiles that opens messaging with context pre-filled. Lowers the blank-page barrier to first contact | S |
| **Saved searches / worker lists** | Contractors hire in bursts; let them save "Journeyman electricians, 30mi, available" and shortlist candidates | M |
| **Share tools** | Copy-link + share-sheet on own profile; QR card generator | S–M |

### Phase 3 — Growth & depth (after liquidity exists in metro #1)

- **Job posts** (contractor-initiated demand): a lightweight "looking for"
  board scoped to trade + location. Only after enough workers exist to answer.
- **Endorsements/references** (carefully — see Section 6): a coworker or GC
  leaving a comment on a *project* is social proof without rebuilding the
  removed supervisor-verification system.
- **Feed follows & pagination**: feed currently shows latest 60 globally.
  Add cursor pagination, then follow/trade filters when volume demands it.
- **PWA install + push notifications**: before building native apps, ship a
  manifest + web push. Tradespeople live on phones; installability is cheap.
  Native apps only when retention proves the product.
- **Second metro** — only when metro #1 has repeatable worker acquisition and
  weekly contractor-initiated conversations.

### Explicitly not now
- Native iOS/Android apps (PWA first)
- Payments/escrow (you are not a gig marketplace; don't become Thumbtack)
- AI features (résumé writers etc. — a photo network's moat is *real* work)
- National expansion

---

## 5. Technical Roadmap & Debt

Ordered by risk-to-real-users:

1. **Rate limiting is per-instance memory.** On Vercel, every serverless
   instance has its own Map — limits are inconsistent and reset constantly.
   Move to Upstash Redis (`@upstash/ratelimit`, free tier is plenty). ~1 hour.
2. **No error monitoring.** Add Sentry (client + server). You cannot fix what
   you can't see; real users will not report bugs, they'll leave. ~1 hour.
3. **No analytics.** Add PostHog or Vercel Analytics + a handful of custom
   events: signup, onboarding_complete, project_created, photo_uploaded,
   search_performed, message_sent. These power every decision in Section 3.
4. **No tests, no CI.** Minimum viable: GitHub Action running `tsc --noEmit` +
   `next build` on PRs (catches the class of bug that broke the Vercel builds
   twice already), plus a few Playwright smoke tests (signup → onboard →
   create project → appears in feed). Half a day, pays for itself immediately.
5. **Feed scalability.** Latest-60-global is fine to ~10k projects. Add cursor
   pagination (`created_at < cursor`) before it matters; the
   `idx_projects_created` index is already in place.
6. **Messaging unread counts** are computed by scanning messages; fine for
   now, revisit with a `conversations` table if DMs grow.
7. **Backups & recovery**: enable Supabase PITR (paid tier) or scheduled
   `pg_dump` before real user data accumulates. Test a restore once.
8. **Image pipeline** (post-compression): Next/Image already optimizes
   delivery; consider Supabase image transformations for thumbnails to cut
   feed bandwidth on mobile.
9. **Env hygiene**: `NEXT_PUBLIC_SITE_URL` env for canonical URLs +
   `metadataBase` once the production domain is final.

---

## 6. Trust & Safety (the identity question)

Supervisor verification was removed deliberately — right call: it added a
third-party dependency into onboarding (the killer of activation) and a fake
authority signal that was easy to game. But trust is still the product's core
promise ("proof, not resumes"). Build trust signals that are **self-evident or
platform-observed**, not gatekept:

- **Photo-native proof**: photos *are* the verification. Lean in — before/after
  pairs, photo counts on profile ("47 job photos"), recency ("posted this week").
- **License numbers as displayed fields** (not verified claims): let
  electricians/HVAC techs add their state license #. Contractors can check it
  against the state DB themselves (TDLR in Texas is public). Later, automate
  the lookup — *that's* a verification feature worth building because it
  requires no third human.
- **Platform-observed signals**: member since, response rate to messages,
  profile completeness. All computable, all honest.
- **Moderation basics** (Phase 1): report content/user, admin ability to
  remove projects and suspend accounts (a simple `is_suspended` flag checked
  in proxy.ts covers it). One spammy porn upload in the feed with no removal
  path is a product-killing event.
- **Content policy**: photos of job sites can capture addresses, homeowners,
  children. The terms cover it; onboarding should hint it ("crop out
  customers' faces and addresses").

---

## 7. Ops Checklist (do these before inviting anyone)

- [ ] Re-run `supabase/schema.sql` (applies RLS hardening + view counter) — *if not already done*
- [ ] Supabase → Auth → URL Configuration: add production URL to Redirect URLs (password reset depends on it)
- [ ] Supabase → Auth → set minimum password length to 8 (matches app)
- [ ] Storage buckets: `image/*` MIME allowlist + size limits on `avatars`, `banners`, `project-photos`
- [ ] Custom domain on Vercel (e.g. `app.joinskillmark.com`) — vercel.app URLs look untrustworthy on a business card
- [ ] Custom SMTP for auth emails (Resend/Postmark) + SPF/DKIM on the domain
- [ ] Sentry + analytics wired (Section 5)
- [ ] Upstash Redis rate limiting (Section 5)
- [ ] Supabase backups enabled; restore tested once
- [ ] Confirm Supabase Auth email confirmations are ON (or consciously OFF for launch friction reasons — lower friction, more spam risk; for a hand-seeded launch, OFF is defensible, turn ON before open signup)

---

## 8. Business Model (later, but decide the shape now)

**Principle: workers never pay.** Supply is the scarce side; charging supply
kills the network. The landing page already promises "free forever" — keep it.

Monetize the demand side, in order of viability:

1. **Contractor Pro subscription** (~$49–99/mo): unlimited search + contact,
   saved searches, candidate lists, priority support. Simple, aligned, proven
   (this is LinkedIn Recruiter's model shrunk to fit).
2. **Job post fees**: pay-per-post or included in Pro.
3. **Never**: selling worker data, pay-to-rank workers, lead fees charged to
   workers (the Thumbtack model tradespeople universally resent — being the
   anti-Thumbtack is a marketing position).

Don't gate anything until contractors demonstrably get value free. Premature
paywalls on an illiquid marketplace just measure zero twice.

---

## 9. Competitive Landscape & Positioning

| Player | What they are | Why SkillMark is different |
|---|---|---|
| **LinkedIn** | White-collar resume network | Text-first, culturally alien to the trades; a welder's LinkedIn is empty, their camera roll is full. SkillMark is photo-first |
| **Indeed/ZipRecruiter** | Job boards | Resume-centric, transactional, no persistent portfolio; workers restart from zero every search |
| **Thumbtack/Angi** | Consumer lead-gen | Sells homeowner leads *to* pros (pros pay, and hate it); B2C jobs, not careers. SkillMark is worker-owned identity + B2B hiring |
| **Facebook groups** | Where this actually happens today | Your real competitor. Unstructured, unsearchable, posts vanish. SkillMark = the structured, permanent version. Also your best acquisition channel |
| **JobSnap/BlueRecruit/etc.** | Trade-hiring startups | Validation that the space is real; none owns the *portfolio* primitive. Speed + focus wins locally |

**Positioning sentence:** *"Your work speaks for itself — SkillMark makes sure
it's heard. The portfolio network for the trades: real job photos, not resumes."*

The durable moat is the **portable career record**. A worker with 3 years and
60 photos on SkillMark can't leave without losing their professional history.
Every product decision should compound that asset.

---

## 10. Metrics That Matter

Stage-gate the roadmap on these, in order:

1. **Activation**: % of signups reaching a profile with ≥1 project photo
   within 7 days. (Target 40%+; below 25% = fix onboarding before anything else)
2. **Supply density**: workers with active profiles *per trade per metro*.
   (Search feels alive at roughly 50+/trade/metro)
3. **Liquidity**: contractor→worker messages per week. The north star.
4. **Retention**: % of workers returning in week 4. A portfolio tool can win
   with modest frequency, but zero return = the profile had no perceived value.
5. Vanity (report, don't steer by): total signups, page views, waitlist size.

---

## 11. Honest Advice

1. **The code is no longer the bottleneck — distribution is.** The app is
   genuinely solid post-audit. The next 90 days should be ~20% code (Phase 1
   list), 80% getting 25 real electricians in one city to post real photos.
   Resist the comfort of building; the repo is the easy part now.
2. **Hand-build the first profiles.** Every marketplace that worked seeded
   supply manually (Airbnb photographed apartments themselves). Twenty
   beautiful, complete profiles beat two hundred empty ones.
3. **Don't re-add verification under pressure.** Contractors will ask "how do
   I know they're good?" The answer is photos, license numbers, and their own
   phone call — not a badge you can't stand behind. A badge you *can't* verify
   is a liability the first time a "verified" hire goes wrong.
4. **Ship the boring ops list first.** Sentry, Redis, backups, SMTP, domain —
   one focused day. Skipping it means learning about your first outage from an
   angry text.
5. **Charge later, but talk about money early.** Ask the first ten contractors
   "would you pay $79/mo for this?" and watch their face. Free forever for
   workers; priced eventually for hirers; say so out loud from day one so
   nobody feels bait-and-switched.
6. **Protect the tone.** "Direct, worker-focused, no-BS" is a real asset in a
   market that's been condescended to by every prior app. Keep marketing in
   that voice — job-site photos, not stock photos of smiling models in clean
   hard hats.
7. **Kill criteria (write them down now):** if after 6 months of honest effort
   in one metro you can't get 100 activated workers or any organic
   contractor-side pull, the wedge is wrong — change the trade, the metro, or
   the entry product (e.g., pivot to "portfolio-as-a-service for trade-school
   grads") *before* changing the mission.

---

## Appendix: Current State Reference

- **Stack**: Next.js 16 (App Router, `proxy.ts`), Supabase (auth/Postgres+RLS/storage/realtime), Tailwind v4, Vercel
- **Repos**: `SkillMark-App` (product), `SkillMark` (static marketing site, deploys from `main`)
- **Recent hardening**: column-whitelisted profile updates, RLS `WITH CHECK` everywhere, locked legacy tables, storage-path-pinned upload URLs, trusted-IP rate limiting, PostgREST injection fixes, password reset flow, mobile nav, SEO metadata, legal pages
- **Known debt**: in-memory rate limiter, no tests/CI, no monitoring/analytics, feed unpaginated, `project_photos` table unused, notifications table has no UI, no account deletion

*This document is a living plan — revisit after the first 25 founding workers
are live and let their behavior overrule any prediction in it.*
