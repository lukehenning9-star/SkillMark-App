# SkillMark — Project Context for Claude

## Next.js Version Warning
This project uses **Next.js 16** — newer than Claude's training data. APIs and conventions may differ. Check `node_modules/next/dist/docs/` if it exists before writing code. Use `params: Promise<{...}>` in page props (already the pattern in this codebase).

---

## What SkillMark Is

A skills portfolio network for skilled tradespeople (electricians, plumbers, HVAC, welders, etc.). Workers upload real job photos to build a portable career profile. Contractors search and find workers.

**There is NO supervisor verification feature.** Workers self-document their own work. No verification emails, no supervisor tags, no verification badges anywhere. This was intentionally removed — do not add it back.

---

## Two Repos

| Repo | Path | Purpose |
|------|------|---------|
| `lukehenning9-star/SkillMark` | `/home/user/SkillMark` | Static marketing site (`index.html`) — joinskillmark.com |
| `lukehenning9-star/SkillMark-App` | `/home/user/SkillMark-App` | Next.js app — the actual product |

**Always push directly to `main`.** No PR workflow needed unless asked.

---

## CRITICAL CONSTANT — NEVER CHANGE
```
FORMSPREE_ID = "xrejekgk"
```
Used in `app/page.tsx` and in `/home/user/SkillMark/index.html`. Must stay exactly this value.

---

## Color System

### App pages — Tailwind v4 tokens (`globals.css`)
```css
--color-navy: #0f1f3d
--color-navy-mid: #1a3260
--color-accent: #1a56db        /* main blue */
--color-sm-bg: #f5f4f1         /* page background */
--color-border: #e4e2de
--color-border2: #d0cec9
--color-text-mid: #3d4f6e
--color-text-dim: #6b7a99
```
Use as Tailwind classes: `bg-accent`, `text-navy`, `border-border`, etc.

### Landing page — custom CSS (`landing.css`)
```css
--accent: #1a56db;  --accent-light: #eff4ff;  --accent-border: #93b8f8;
--navy: #0f1f3d;    --navy-light: #2a4a8a;
```
Hover: `#1648c0`. On dark navy backgrounds use `#7eb3f8` for tinted text/icons.

---

## File Map

```
app/
  page.tsx              ← Marketing landing page (NOT the app)
  landing.css           ← Custom CSS for landing page only
  layout.tsx            ← Root layout, fonts (Playfair Display + Plus Jakarta Sans), meta
  globals.css           ← Tailwind v4 theme tokens
  dashboard/
    page.tsx            ← Main feed (currently redirects to profile — see TODO below)
    FeedClient.tsx      ← Social feed client component (see TODO)
  [username]/
    page.tsx            ← Public profile page (server component)
    ProfileView.tsx     ← Profile UI (client component, large file)
  projects/
    new/NewProjectForm.tsx + page.tsx
    [id]/page.tsx       ← Project detail
    [id]/edit/EditProjectForm.tsx + page.tsx
  search/SearchClient.tsx + page.tsx
  settings/SettingsForm.tsx + CertificationsSection.tsx + page.tsx
  messages/MessagesClient.tsx + page.tsx
  onboarding/OnboardingClient.tsx + page.tsx
  actions/
    auth.ts             ← signup/login, rate limiting, 8-char min password
    profile.ts          ← saveProfileStep, addWorkExperience, deleteWorkExperience,
                          updateWorkExperience, incrementProfileViews,
                          saveAvatarUrl, saveBannerUrl, completeOnboarding
    projects.ts         ← createProject, updateProject, deleteProject,
                          saveProjectCoverPhoto, saveProjectBeforePhoto, saveProjectAfterPhoto
    certifications.ts + messages.ts + upload.ts
  api/check-username/route.ts   ← GET ?username=... → { available: boolean }
components/
  AppNav.tsx            ← Sticky nav: Feed / My Profile / Search / Add Project
  UserMenuDropdown.tsx
  AvatarCropModal.tsx
lib/
  types.ts              ← TypeScript types (see below)
  supabase/server.ts + client.ts
middleware.ts           ← Supabase session refresh
supabase/schema.sql     ← Full DB schema — paste into Supabase SQL Editor to set up
```

---

## TypeScript Types (`lib/types.ts`)

```typescript
type Profile = {
  id: string; username: string; full_name: string | null;
  headline: string | null; bio: string | null;
  avatar_url: string | null; banner_url: string | null;
  trade: string | null;
  experience_level: "apprentice" | "journeyman" | "master" | null;
  years_experience: number;
  city: string | null; state: string | null;
  is_available: boolean;
  union_status: "Union Member" | "Non-Union" | "Open to Both" | null;
  profile_views: number; verified_project_count: number; // verified_project_count is legacy, harmless
  dark_mode_preference: boolean; onboarding_complete: boolean;
  created_at: string;
}

type WorkExperience = {
  id: string; profile_id: string;
  job_title: string; company_name: string;
  start_date: string; end_date: string | null;
  is_current: boolean; description: string | null;
  created_at: string;
}

type Project = {
  id: string; profile_id: string;
  title: string; description: string | null;
  trade_category: string | null; specific_skills: string[];
  location: string | null; completed_date: string | null;
  cover_photo_url: string | null; before_photo_url: string | null; after_photo_url: string | null;
  created_at: string;
  // NOTE: verification_status/supervisor_name/supervisor_email exist in the DB schema
  // but are NOT in this type and NOT queried anywhere. Leave them alone.
}

type Certification = {
  id: string; profile_id: string;
  name: string; issuing_org: string | null;
  date_earned: string | null; expiry_date: string | null;
  created_at: string;
}

type Message = {
  id: string; sender_id: string; recipient_id: string;
  content: string; read_at: string | null; created_at: string;
}
```

---

## Database Tables

| Table | Notable columns | RLS |
|-------|----------------|-----|
| `profiles` | id (= auth.users.id), username, full_name, trade, experience_level, city, state, is_available, union_status, profile_views, onboarding_complete | public read, own write |
| `work_experience` | profile_id, job_title, company_name, start_date, end_date, is_current, description | public read, own write |
| `projects` | profile_id, title, description, trade_category, specific_skills[], location, cover_photo_url, before_photo_url, after_photo_url | public read, own write |
| `project_photos` | project_id, photo_url, caption, display_order (unused in app UI currently) | public read, own write |
| `certifications` | profile_id, name, issuing_org, date_earned, expiry_date | public read, own write |
| `messages` | sender_id, recipient_id, content, read_at | own messages only |
| `notifications` | profile_id, type, title, body, read, link (no UI yet) | own only |
| `supervisor_verifications` | (legacy table, exists but unused) | — |

Trigger: `handle_new_user()` auto-creates a `profiles` row on `auth.users` insert.

---

## Auth & Security

- Supabase Auth handles bcrypt — passwords never stored plain text
- Rate limiting in `actions/auth.ts`: 5 signup/min, 10 login/min per IP
- Minimum password: **8 characters** — enforced client (`minLength={8}`) and server
- `middleware.ts` refreshes session on every request

---

## What's Built

- **Landing page** (`app/page.tsx`): hero, stats, Why Trades, How It Works, Mission, Signup, Waitlist — scroll-reveal animations, green color scheme, Formspree waitlist
- **Auth**: signup (email/username/password), login, username availability check
- **Onboarding**: post-signup flow
- **Profile** (`/[username]`): banner, avatar, headline, bio, trade, work experience, projects grid, certifications, profile views, available badge, message button
- **Projects**: create/edit/delete, cover + before + after photo upload (Supabase Storage), project detail page
- **Settings**: edit all profile fields, avatar crop+upload, banner upload, work experience CRUD
- **Search** (`/search`): live filter by keyword/trade/level/state/union/availability
- **Messages** (`/messages`): real-time messaging, unread count badge in nav
- **AppNav**: Feed / My Profile / Search / Add Project / Messages / User dropdown

---

## TODO — Dashboard Feed (Priority)

The dashboard (`/dashboard`) currently redirects to the user's profile. It should be a social feed.

**Create `app/dashboard/FeedClient.tsx`** (client component):
```typescript
export type FeedProject = {
  id: string; title: string; description: string | null;
  cover_photo_url: string | null; before_photo_url: string | null; after_photo_url: string | null;
  specific_skills: string[]; trade_category: string | null; created_at: string;
  profiles: { username: string; full_name: string | null; avatar_url: string | null; trade: string | null; };
};
```
- `timeAgo(dateStr)` → "2h ago", "3d ago", etc.
- `PhotoCarousel`: photos = [cover, before, after].filter(Boolean), idx state, left/right arrows, dot indicators
- `FeedCard`: profile header (avatar + name + trade + timestamp) → title + description (line-clamp-4) → PhotoCarousel → skill tags → "View full project →"
- Default export renders `space-y-4` list of cards, empty state with link to add project

**Update `app/dashboard/page.tsx`** (server component):
```typescript
const { data: raw } = await supabase
  .from("projects")
  .select(`id, title, description, cover_photo_url, before_photo_url, after_photo_url,
           specific_skills, trade_category, created_at,
           profiles(username, full_name, avatar_url, trade)`)
  .order("created_at", { ascending: false })
  .limit(60);
// filter out rows where profiles is null, cast to FeedProject[], render in max-w-[470px] mx-auto
```

---

## Other Pending

- **Notifications**: table exists in DB, no UI yet
- **project_photos table**: exists for multi-photo projects, not wired to the UI — currently app uses only cover/before/after (3 max)
- **Mobile nav**: search/feed navigation on small screens could use a bottom nav bar

---

## Code Conventions

```typescript
// Server action pattern
"use server";
export async function myAction(formData: FormData) {
  const supabase = await createClient(); // from @/lib/supabase/server
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
}

// Common Tailwind input class
"w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all"

// Common label class
"block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5"
```

## Scroll Animations (both sites)

```css
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
.reveal.visible { opacity: 1; transform: translateY(0); }
.reveal-d1 { transition-delay: 0.12s; } .reveal-d2 { transition-delay: 0.24s; } .reveal-d3 { transition-delay: 0.36s; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1 !important; transform: none !important; transition: none !important; } }
/* Mobile override intentionally REMOVED — animations work on mobile */
```

## Brand / Copy

- Tagline: "The skills network for the trades" (NOT "verified skills network")
- Hero: "The skills network / for the *trades.*"
- Hero sub: "through real job photos and proven work, not resumes"
- How It Works: 01 Build Profile → 02 Upload Work → 03 Grow Your Portfolio → 04 Connect Directly
- Mission closing: "a professional digital identity — portable, permanent, and entirely yours"
- Tone: direct, worker-focused, no-BS, respectful of skilled labor
