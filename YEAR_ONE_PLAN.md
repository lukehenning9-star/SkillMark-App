# SkillMark — Year One Plan

*The complete playbook: premise critique, competitor lessons, quarter-by-quarter
roadmap, experiments to run, flaws to fix, and decision gates. Written July 2026.
Figures marked (~) are best-known estimates — re-verify before quoting publicly.*

**Companion doc:** `FUTURE_PLANS.md` (strategy fundamentals, 30/60/90, ops
checklist). This document extends it to a full year and goes deeper.

---

## Part 1 — The Premise, Sharpened

The pitch: *LinkedIn runs on job-title prestige; the trades run on work.
SkillMark is the professional network where the profile IS the portfolio —
real job photos instead of resumes.*

That's a genuinely good insight. The proof: **GitHub**. Developers stopped
needing resumes because the artifact of their daily work became their public
professional identity. Nobody set out to "network" on GitHub — they stored
their work there, and hiring signal emerged as a byproduct. That's the model:
**make the portfolio a byproduct of something workers already do (photographing
their work), and let hiring emerge from it.**

But be honest about where the analogy breaks — these are the premise's real
flaws, and each needs an answer:

### Flaw 1: "LinkedIn for X" is a graveyard framing
LinkedIn works because white-collar careers are national, resume-legible, and
recruiters pay for access at scale. Trades hiring is **local, urgent, and
referral-driven**. A foreman needs two journeymen *this week, within 40 miles* —
not a global feed. **Answer:** SkillMark must behave like a *local reputation
system*, not a global social network. Metro-scoped feed, metro-scoped search,
metro-by-metro rollout (the Nextdoor playbook, not the LinkedIn one).

### Flaw 2: Photos don't prove authorship
Anyone can upload photos of someone else's panel. Today there is zero defense.
**Answer (layered, no gatekeepers):** before/after pairs are harder to fake
than single glamour shots — weight them in the UI; capture-date from EXIF
("photographed over 6 months" is a credibility signal); volume + consistency
(47 photos across 2 years is nearly impossible to fake); displayed license
numbers checkable against state databases (TDLR in Texas is public); and a
report mechanism. Never a "verified" badge you can't stand behind.

### Flaw 3: Workers don't job-hunt continuously
LinkedIn's dirty secret is most users touch it only when job hunting. A trades
network has the same dead-zone risk between hunts. **Answer:** single-player
utility that's valuable *while employed* — this is the Doximity lesson (their
free Dialer tool made doctors open the app daily, and the network rode along).
SkillMark's equivalents, in order of power:
1. **License & cert renewal reminders** ("Your EPA 608 expires in 60 days") —
   trivially cheap to build, genuinely valuable, gives a reason to keep the
   profile current. Certifications table already exists.
2. **The work log habit**: framing project posting as *documenting* ("your
   career record"), not *broadcasting*. A worker documenting for themselves
   posts weekly; a worker "promoting" posts once.
3. **Pay/rate benchmarks by trade + metro** (later, once there's data): the #1
   thing tradespeople actually discuss.

### Flaw 4: Public availability can burn workers with current employers
`is_available` is public. A employed journeyman flagged "available" is telling
his boss he's leaving. **Answer:** build **quiet looking** — "visible to
searches but don't show the available badge publicly" or "only contractors I
message first." This is LinkedIn's "Open to Work (recruiters only)" and it
exists because this exact fear is universal. High priority, small build.

### Flaw 5: The contractor side has a feature, not a workflow
Search exists; hiring is a workflow (find → shortlist → contact → track →
decide). **Answer:** Phase-2 candidate lists + saved searches + quick-contact
(already in FUTURE_PLANS), then a simple pipeline view in Q3.

### Flaw 6: Photo rights & privacy are a real minefield
Job-site photos can capture homeowner addresses, faces, security systems; some
employment/GC contracts claim ownership of jobsite photos. **Answer:** the
Terms cover the basics; add an upload-time nudge ("crop out faces/addresses"),
and a takedown path (report → admin removal). Don't ignore this — one angry GC
letter is survivable, a pattern isn't.

### Flaw 7: Union vs. open-shop
Union halls control dispatch for a meaningful slice of the market (electrical
especially); those workers don't need a hiring network — the hall IS the
network. **Answer:** SkillMark's beachhead is **open-shop/merit-shop workers
and small contractors** (the majority in Texas). Union members still get
portfolio value (side work, career record). Be deliberate: don't pitch
against the hall, pitch alongside it.

### Flaw 8: One founder, two repos, zero tests
The biggest operational risk is you. Every hour on code is an hour not seeding
the network. **Answer:** the Q1 hardening list is deliberately small; after
that, cap product work at ~1 day/week until liquidity metrics say otherwise.

---

## Part 2 — Competitor & Playbook Lessons

*(From training knowledge through early 2026 — statuses worth re-verifying.)*

### People who tried ~this exact thing

| Company | What happened | The lesson for SkillMark |
|---|---|---|
| **Trade Hounds** (Boston, ~2018) | "LinkedIn for construction." Raised ~$11M. Built a genuinely active community (job-site photo feed; claimed 100k+ tradespeople), then pivoted revenue toward employer hiring products | Closest analog and partial validation: tradespeople WILL post work photos at scale. Community engagement came first, hiring revenue second. Watch them closely; differentiate on *portable career record + local density*, not feed |
| **WorkHands** (~2013) | Original "LinkedIn for blue collar." Network didn't take off; **pivoted successfully** into apprenticeship-management SaaS for training programs | The profile network alone didn't monetize, but the *records/credentials infrastructure* did. This is SkillMark's best pivot-adjacent path if the network stalls (see Q4 gates) |
| **BlueRecruit** (~2019) | Skilled-trades matching marketplace (profiles + employer search). Alive but small | Pure matching without community/single-player value = low engagement between job hunts. Confirms Flaw 3 |
| **Workrise/RigUp** | Energy staffing marketplace; raised ~$750M, hit ~$2.9B valuation, then massive contraction | Do NOT drift into staffing (taking margin on labor). Staffing economics are brutal and operational; networks are capital-light. If someone offers to make you a "labor marketplace," that's the trap |
| **Faber, BuildForce** | Construction labor marketplaces (Canada / Austin TX) | Same lesson: they place crews for projects; SkillMark owns *identity*. Complementary, not competitors — potential partners/acquirers |
| **JobSnap, SkillHero** | Video-resumes for gig trades; student career pathways | Fragments of the vision; SkillHero's school distribution idea is worth stealing (see Q2 trade-school pilot) |
| **Polywork** and most LinkedIn challengers | Shut down (~2024) despite heavy funding | Prestige-signaling networks with no wedge utility die. Utility first, always |

### Playbooks from adjacent winners

| Platform | The move to steal |
|---|---|
| **Doximity** (doctors) | Seeded with **pre-verified identity** (physician directories/NPI numbers) and won daily use with a free utility (Dialer). Monetized the B-side only; doctors never pay. → SkillMark: license-number lookup as the identity anchor; cert reminders as the utility; contractors pay, workers never |
| **GitHub** | Portfolio as byproduct of daily work → hiring emerged organically | Frame posting as *documenting*, not self-promotion |
| **Houzz** | **Photos = SEO moat.** Millions of project photos made Houzz own every "kitchen remodel ideas" search; pros paid to be visible in that traffic. Also a warning: pros grew to resent lead-gen pricing | Programmatic local SEO pages (`/electricians-waco-tx`) built from profiles/projects could own "hire [trade] [city]" queries — Google is the biggest distribution channel nobody in this niche has captured. And: never charge workers for visibility |
| **Behance/Dribbble** | Seeded via **curation and scarcity** (invites, featured work) | "Founding member" + featured Project of the Week = aspirational join dynamics |
| **Nextdoor** | City-by-city rollout with founding-neighbor quotas before "opening" a neighborhood | Metro gating: don't open a metro until N workers are committed; empty = dead on arrival |
| **Strava/Untappd** | Single-player tracking → segments/competition → network | The work-log framing + monthly photo contests |

### Pricing anchors for the contractor side (~2025-26, verify current)

| Product | Price | Note |
|---|---|---|
| LinkedIn Recruiter Lite | ~$170/mo | The "search professionals + InMail" comp |
| ZipRecruiter | ~$299+/mo | SMB hiring subscription |
| Houzz Pro | ~$85–$399/mo | Photo-first pro subscription |
| Thumbtack | ~$15–80+ per lead | The resented model — the anti-anchor |
| Indeed sponsored post | ~$5–25/day | Per-post alternative |
| Staffing agency markup | 40–70% of wage | What desperate contractors actually pay today |

**Implication:** a $79–99/mo SkillMark Pro for contractors is well inside the
band, and *dramatically* cheaper than the staffing agencies they use when
desperate. Anchor the pitch against staffing markup, not against job boards.

### Market context (~, re-verify before quoting)

- Construction industry needs ~400–500k additional workers per year (ABC
  estimates ~439–501k in 2024–25 forecasts); the landing page's "499K" figure
  is in the right band but check the current-year number
- ~40% of the construction workforce projected to retire by ~2031 (NCCER);
  median tradesperson age ~42+
- **The "toolbelt generation" is real**: vocational/trade community-college
  enrollment up ~16% in 2023, construction-trades programs up ~20%+ since
  2018 — young entrants need portfolios most (no work history) and are the
  most phone-native. Best acquisition cohort
- ~One-third of US construction workers are Hispanic/Latino → **Spanish
  localization is a genuine differentiator, not a checkbox** (see Q2)
- Where they are online: massive trade communities on Reddit (r/electricians,
  r/HVAC, r/Plumbing, r/Construction — hundreds of thousands each), trade
  Facebook groups (10k–200k members each), and booming TikTok/IG blue-collar
  content (#bluecollar / #electrician videos in the billions of views).
  Contractors hire via referral first, then Facebook/Craigslist/Indeed

---

## Part 3 — The Year, Quarter by Quarter

**One sentence per quarter:** Q1 seed supply and harden ops; Q2 build
liquidity and the SEO/school engines; Q3 turn on revenue and prove one metro;
Q4 double down or execute a pre-planned pivot.

Throughout: ~80% distribution / 20% code. The repo is ahead of the network.

---

### Q1 (Months 1–3): Foundation + Seed — "25 real profiles beat everything"

**Build (≈2 weeks total, then stop building):**
- [ ] Everything in `FUTURE_PLANS.md` §7 ops checklist (schema re-run, redirect
      URLs, SMTP/Resend + SPF/DKIM, custom domain, Sentry, PostHog, Upstash
      rate limiting, backups + one restore drill)
- [ ] CI: GitHub Action on PR — `tsc --noEmit` + `next build` + 3 Playwright
      smoke tests (signup→onboard, create project→appears in feed, send message)
- [ ] Account deletion (settings + cascade delete + storage cleanup)
- [ ] Client-side image compression (`browser-image-compression`, ~1600px,
      <1MB target) — job-site photos are 4–12MB HEIC; this protects the core loop
- [ ] Report content/user + `is_suspended` flag checked in proxy.ts + a
      barebones `/admin` page (list reports, remove project, suspend user)
- [ ] **Quiet-looking mode** (Flaw 4): `availability_visibility` on profiles
- [ ] License number field on profiles (display + "Look up on TDLR" link) — v1
      of trust without gatekeepers
- [ ] Copy-profile-link + share-sheet button; simple QR code page per profile

**Distribute:**
- Hand-build 25 founding profiles (Waco/Central TX; electrical + HVAC). Sit
  with each worker 20 minutes, upload from their camera roll. Non-negotiable —
  this is also your user research
- Founding Member badge + permanent free promise, numbered (#1–#100)
- Post/feature something in the feed every single day (Project of the Week)
- Start ONE social channel and stay consistent: repurpose members' best
  before/afters into TikTok/IG reels (with permission). "Rate this panel"
  formats. Goal: 3 posts/week, not virality — a drumbeat

**Gate to Q2:** 25+ profiles with ≥3 photos each; instrumentation live; you
personally know 25 tradespeople's actual complaints.

---

### Q2 (Months 4–6): Liquidity Engines — school pipeline, SEO, digests, Spanish

**Build:**
- [ ] Notifications UI (table exists) + **weekly digest email**: "3 contractors
      viewed your profile" / "your project got 40 views." The single best
      retention lever available
- [ ] Profile + project **view counting surfaced to owners** (views RPC exists;
      add project views)
- [ ] Multi-photo projects (wire the dormant `project_photos` table; 10-photo
      galleries; keep before/after as featured pair)
- [ ] **Metro-scoped feed** (Flaw 1): default feed = your metro, toggle to all
- [ ] Contractor quick-contact ("Interested in hiring" pre-filled message) +
      saved searches + shortlists
- [ ] **Programmatic local SEO pages**: `/t/[trade]/[city-state]` — server-
      rendered directory pages ("Electricians in Waco, TX") listing available
      workers with photo counts, linked from profiles, in sitemap.xml. The
      Houzz moat, miniaturized. Add `sitemap.ts`
- [ ] **Spanish localization** of onboarding + profile + landing (next-intl).
      Start with es-MX for the highest-impact surfaces, not the whole app
- [ ] PWA manifest + web push (for message notifications)
- [ ] Cert renewal reminders v1 (expiry_date exists → cron → email). The
      Doximity-Dialer of this product

**Distribute:**
- **Trade-school pilot #1** (TSTC Waco is the obvious target): "Portfolio Day"
  — every graduating student leaves with a completed SkillMark profile.
  Offer instructors a simple class view (this seeds the WorkHands-style SaaS
  option later). Students are ideal: no work history, need proof, phone-native
- **Monthly photo contest**: "Best [trade] project in Central Texas," $250
  prize, entry = posted project, winner featured + pushed to social. Cheap
  CAC + content engine + shareable
- Foreman-referral mechanic: "Add a reference" → email invite to the GC/foreman
  (an invite loop, NOT a verification gate)
- Begin contractor conversations (5–10 personally onboarded; watch them search)

**Gate to Q3:** 150–300 activated workers in metro #1; ≥40% of signups post a
photo in week 1; first organic contractor-initiated messages happening without
your involvement; SEO pages indexed.

---

### Q3 (Months 7–9): Revenue + Density — prove someone will pay

**Build:**
- [ ] **SkillMark Pro for contractors** — $79/mo (founding rate $39, grandfathered):
      unlimited quick-contact, saved searches, shortlists/pipeline view,
      "new workers in your trade+metro" alerts. Stripe + a `subscriptions`
      table + feature gates. Workers stay free forever, loudly
- [ ] Lightweight **job posts** board (trade + metro scoped) — included in Pro.
      Only now, because only now can posts get answers
- [ ] **Company/crew pages** for small contractors (their own photo portfolio —
      helps them recruit; makes them stakeholders, not just buyers)
- [ ] Project **references/comments** ("I was the GC on this job — solid work")
      — social corroboration, opt-in, reportable (the honest version of
      verification per Flaw 2)
- [ ] Feed pagination + conversations-table refactor if message volume demands
- [ ] Admin analytics: activation funnel, contact events, cohort retention

**Distribute:**
- Convert your hand-onboarded contractors to founding-rate Pro. Target: **10
  paying by month 9.** Ten contractors at $39–79 ≈ ramen money, but it's the
  only proof that matters for everything downstream
- Union-adjacent motion: side-work/moonlighting framing for union members
  (portfolio for weekend jobs) — without antagonizing halls
- Metro #2 **only if** metro #1 gates were hit (Austin or DFW — bigger, but
  only with a repeatable playbook written down from metro #1)
- Pitch local trade associations (ABC Central Texas chapter, PHCC, ACCA
  locals) — newsletter features, meeting demos

**Gate to Q4:** ≥500 activated workers; ≥10 paying contractors; ≥25
contractor→worker conversations/week; W4 retention ≥25%.

---

### Q4 (Months 10–12): The Decision Quarter

Three pre-planned paths — decide by data, not mood:

**Path A — Double down (gates hit):** raise a small round or bootstrap harder.
A credible seed story at this point: one dense metro, 500–1,000 activated
workers, 10–25 paying contractors, working school pipeline, SEO traffic
compounding. Build: native-app decision (only if PWA push proved retention),
metro playbook #3, first hire (community manager, not engineer).

**Path B — The WorkHands pivot (network flat, schools engaged):** the
class-dashboard becomes the product: portfolio + placement SaaS sold to trade
schools and apprenticeship programs (~$2–5k/yr per program). Same code, same
mission, revenue from institutions instead of liquidity. The student profiles
still seed the network for a later swing.

**Path C — The utility wedge (both flat):** strip to the single-player killer:
license/cert tracker + work log + portfolio export for tradespeople. Charge
$0; grow it as the identity layer; re-attempt the network from a bigger base
later. (Or the honest version: shut it down cleanly, export everyone's data —
the "entirely yours" promise — and take the learnings.)

**Also in Q4 regardless:** data export feature (own-your-data promise made
real — it's both ethics and marketing), annual security re-audit, SOC2-lite
hygiene write-up if pitching institutions.

---

## Part 4 — Experiment Backlog (try these, measure, kill fast)

Ranked by expected impact ÷ effort:

1. **License auto-badge (TX)**: nightly job checks entered license #s against
   the public TDLR roster → "License active ✓ (TDLR)" display. First real
   verification that requires zero humans. If it works, it's the moat seed
2. **Programmatic SEO pages** (Q2 build) — measure: indexed pages, organic
   signups/mo. This can quietly become the #1 acquisition channel
3. **$250 monthly photo contest** — measure: entries, new signups per contest
4. **Portfolio Day at one trade school** — measure: profiles created, 30-day
   retention of student cohort vs. baseline
5. **QR hard-hat stickers** (500 printed, given to founding members) —
   measure: scans (unique URLs per member)
6. **"Rate this panel" TikTok format** — measure: profile clicks from bio link
7. **Craigslist/FB-Marketplace arbitrage**: DM tradespeople advertising
   services there; offer to build their profile — measure: conversion rate
8. **Weekly digest email** — measure: open rate, W4 retention lift vs. holdout
9. **Spanish onboarding** — measure: es-flow completion rate vs. English
10. **Before/after Reels repurposing service** ("post on SkillMark, we'll cut
    your Reel") — measure: takers, follower growth
11. **Pay-band survey** ("what do journeymen make in Waco?") — content +
    email-capture magnet; publish results, get local press
12. **Foreman reference invites** — measure: invite→signup conversion (this
    quietly recruits the contractor side through workers)

---

## Part 5 — Metrics Dashboard (build in PostHog, review weekly)

| Metric | Definition | Q1 | Q2 | Q3 | Q4 |
|---|---|---|---|---|---|
| Activated workers | ≥1 project w/ photo | 25 | 150–300 | 500 | 1,000 |
| Activation rate | % signups activated ≤7d | 40% | 45% | 50% | 50% |
| W4 retention | % returning week 4 | — | 20% | 25% | 30% |
| Liquidity | contractor→worker msgs/wk | — | first organic | 25 | 75 |
| Paying contractors | active Pro subs | — | — | 10 | 25 |
| SEO | organic signups/mo | — | first | 25 | 100 |
| Density | activated workers/trade in metro 1 | 12 | 75 | 150 | 250 |

Vanity metrics to report but never steer by: total signups, waitlist size,
page views, social followers.

**Budget reality:** infra ~$100–200/mo (Supabase Pro, Vercel, Sentry, PostHog,
Resend, Upstash) + ~$300/mo experiments (contest prizes, stickers, gas money
for job-site visits). Year-one cash cost ≈ $5–7k. The scarce resource is your
weeks, not dollars.

---

## Part 6 — Final Advice (the things I'd tell you over a beer)

1. **You are past the build-more trap.** The product, post-audit, is better
   than what Trade Hounds launched with. Every marginal hour in the repo now
   has worse ROI than an hour in a supply house parking lot talking to
   electricians. The Q1 build list is two weeks; hold the line after that.
2. **Density is the entire product.** 250 activated electricians in Waco is a
   business; 5,000 scattered nationwide is a screenshot. Every decision —
   feed scoping, SEO pages, contests, schools — should concentrate, not spread.
3. **The students are the beachhead nobody owns.** Experienced journeymen have
   reputations already; graduating students have nothing but their school
   projects and a phone full of photos. They need you most, adopt fastest,
   and in five years they're the whole market. The trade-school pipeline is
   the single highest-conviction bet in this plan.
4. **Never charge workers. Never sell leads priced per-contact. Never become
   a staffing agency.** Three business models will knock on the door; all
   three poison the well that makes this defensible (worker trust). The
   Thumbtack resentment and the Workrise implosion are the cautionary tales.
5. **Verification pressure will return — hold the line from Flaw 2.** Photos,
   volume, license lookups, and references are honest signals. A badge you
   can't stand behind is a lawsuit and a credibility bomb with a timer.
6. **Write the metro playbook as you go.** Every hand-onboarding, every school
   visit, every contest — document what worked in a running doc. Metro #2
   succeeds or fails on whether metro #1's playbook is real or vibes.
7. **Talk about money from day one.** "Free forever for workers; contractors
   will pay eventually" said out loud early means nobody feels tricked at the
   Q3 paywall. Price against staffing-agency markup (40–70%), not job boards.
8. **Decide Q4 by the gates you wrote in Q1.** The kill/pivot criteria above
   were written when you were clear-headed. Trust past-you over
   sunk-cost-you. Paths B and C are not failure — WorkHands' pivot is a
   thriving company; the mission (a portable record of skilled work) survives
   in all three paths.
9. **Verify the numbers I've marked (~) before putting them on the site or in
   a pitch deck** — competitor statuses, shortage figures, and pricing move;
   the strategic logic here doesn't depend on them, but your credibility does.
10. **The mission is right.** A tradesperson's reputation currently lives in a
    foreman's contacts and dies every time they change employers. Fixing that
    is worth a year of parking lots. Go get the first 25.
