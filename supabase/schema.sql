-- ──────────────────────────────────────────────────────────────
-- SkillMark Database Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- Idempotent: safe to re-run on an existing database to apply
-- policy/constraint/index updates.
-- ──────────────────────────────────────────────────────────────


-- ── PROFILES ──────────────────────────────────────────────────
create table if not exists profiles (
  id                     uuid references auth.users on delete cascade primary key,
  username               text unique not null,
  full_name              text,
  headline               text check (char_length(headline) <= 120),
  bio                    text check (char_length(bio) <= 300),
  avatar_url             text,
  banner_url             text,
  trade                  text,
  experience_level       text check (experience_level in ('apprentice', 'journeyman', 'master')),
  years_experience       int default 0,
  city                   text,
  state                  text,
  is_available           bool default true,
  union_status           text check (union_status in ('Union Member', 'Non-Union', 'Open to Both')),
  profile_views          int default 0,
  verified_project_count int default 0,
  dark_mode_preference   bool default false,
  onboarding_complete    bool default false,
  created_at             timestamptz default now()
);

alter table profiles enable row level security;

-- Username format: 3-30 chars from signup, or the 36-char uuid fallback set
-- by the signup trigger. Blocks oversized / malformed values written by any
-- other path.
do $$ begin
  alter table profiles add constraint profiles_username_format
    check (char_length(username) between 3 and 36 and username ~ '^[a-z0-9_-]+$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table profiles add constraint profiles_full_name_len check (char_length(full_name) <= 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table profiles add constraint profiles_trade_len check (char_length(trade) <= 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table profiles add constraint profiles_city_len check (char_length(city) <= 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table profiles add constraint profiles_state_len check (char_length(state) <= 50);
exception when duplicate_object then null; end $$;

drop policy if exists "Profiles are publicly readable" on profiles;
create policy "Profiles are publicly readable"
  on profiles for select using (true);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Column-level lockdown: clients must NOT be able to set username (bypasses
-- signup validation), profile_views, or verified_project_count directly.
-- profile_views is incremented only via the SECURITY DEFINER function below.
revoke update on table profiles from anon, authenticated;
grant update (
  full_name, headline, bio, avatar_url, banner_url, trade,
  experience_level, years_experience, city, state, is_available,
  union_status, dark_mode_preference, onboarding_complete
) on profiles to authenticated;

-- Case-insensitive username uniqueness ("Marcus" vs "marcus").
create unique index if not exists idx_profiles_username_lower on profiles (lower(username));


-- ── MIGRATION: add columns to existing databases ─────────────
alter table profiles add column if not exists union_status text
  check (union_status in ('Union Member', 'Non-Union', 'Open to Both'));
alter table profiles add column if not exists headline text
  check (char_length(headline) <= 120);


-- ── PROFILE VIEW COUNTER ──────────────────────────────────────
-- Runs as definer so it works even though profile_views is not
-- client-updatable. Callers can only increment by 1, never set a value.
create or replace function increment_profile_views(target_profile_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update profiles set profile_views = profile_views + 1
  where id = target_profile_id and id <> auth.uid();
$$;

revoke execute on function increment_profile_views(uuid) from anon;
grant execute on function increment_profile_views(uuid) to authenticated;


-- ── SELF-SERVE ACCOUNT DELETION ───────────────────────────────
-- Lets a signed-in user permanently delete their own account. Deleting the
-- auth.users row cascades to profiles (on delete cascade) and from there to
-- work_experience, projects, project_photos, certifications, messages, and
-- notifications — removing all of the user's personal data in one shot.
-- SECURITY DEFINER so it can touch auth.users; scoped strictly to auth.uid().
create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function delete_own_account() from anon;
grant execute on function delete_own_account() to authenticated;


-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    insert into public.profiles (id, username, full_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'username', new.id::text),
      coalesce(new.raw_user_meta_data->>'full_name', '')
    );
  exception when unique_violation then
    -- Username taken in a race between the availability check and signup:
    -- fall back to a unique placeholder instead of aborting the signup.
    insert into public.profiles (id, username, full_name)
    values (
      new.id,
      'user-' || replace(new.id::text, '-', ''),
      coalesce(new.raw_user_meta_data->>'full_name', '')
    );
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── WORK EXPERIENCE ───────────────────────────────────────────
create table if not exists work_experience (
  id               uuid default gen_random_uuid() primary key,
  profile_id       uuid references profiles on delete cascade not null,
  job_title        text not null,
  company_name     text not null,
  start_date       date not null,
  end_date         date,
  is_current       bool default false,
  description      text,
  supervisor_name  text,
  supervisor_email text,
  created_at       timestamptz default now()
);

alter table work_experience enable row level security;

do $$ begin
  alter table work_experience add constraint workexp_job_title_len check (char_length(job_title) <= 200);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table work_experience add constraint workexp_company_len check (char_length(company_name) <= 200);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table work_experience add constraint workexp_description_len check (char_length(description) <= 2000);
exception when duplicate_object then null; end $$;

drop policy if exists "Work experience is publicly readable" on work_experience;
create policy "Work experience is publicly readable"
  on work_experience for select using (true);

-- Split the old FOR ALL policy: UPDATE needs WITH CHECK so a row cannot be
-- re-parented onto another user's profile.
drop policy if exists "Users can manage own work experience" on work_experience;
create policy "Users can insert own work experience"
  on work_experience for insert to authenticated with check (auth.uid() = profile_id);
create policy "Users can update own work experience"
  on work_experience for update to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "Users can delete own work experience"
  on work_experience for delete to authenticated using (auth.uid() = profile_id);

create index if not exists idx_workexp_profile on work_experience (profile_id);


-- ── PROJECTS ──────────────────────────────────────────────────
create table if not exists projects (
  id                  uuid default gen_random_uuid() primary key,
  profile_id          uuid references profiles on delete cascade not null,
  title               text not null,
  description         text,
  trade_category      text,
  specific_skills     text[] default '{}',
  location            text,
  completed_date      date,
  cover_photo_url     text,
  before_photo_url    text,
  after_photo_url     text,
  verification_status text default 'unverified'
                        check (verification_status in ('unverified', 'pending', 'verified')),
  supervisor_name     text,
  supervisor_email    text,
  verification_token  uuid unique default gen_random_uuid(),
  verified_at         timestamptz,
  created_at          timestamptz default now()
);

alter table projects enable row level security;

do $$ begin
  alter table projects add constraint projects_title_len check (char_length(title) <= 200);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table projects add constraint projects_description_len check (char_length(description) <= 5000);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table projects add constraint projects_skills_bound
    check (array_length(specific_skills, 1) is null or array_length(specific_skills, 1) <= 20);
exception when duplicate_object then null; end $$;

drop policy if exists "Projects are publicly readable" on projects;
create policy "Projects are publicly readable"
  on projects for select using (true);

drop policy if exists "Users can manage own projects" on projects;
create policy "Users can insert own projects"
  on projects for insert to authenticated with check (auth.uid() = profile_id);
create policy "Users can update own projects"
  on projects for update to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "Users can delete own projects"
  on projects for delete to authenticated using (auth.uid() = profile_id);

create index if not exists idx_projects_profile on projects (profile_id, created_at desc);
create index if not exists idx_projects_created on projects (created_at desc);


-- ── PROJECT PHOTOS ────────────────────────────────────────────
create table if not exists project_photos (
  id            uuid default gen_random_uuid() primary key,
  project_id    uuid references projects on delete cascade not null,
  photo_url     text not null,
  caption       text,
  display_order int default 0,
  created_at    timestamptz default now()
);

alter table project_photos enable row level security;

drop policy if exists "Project photos are publicly readable" on project_photos;
create policy "Project photos are publicly readable"
  on project_photos for select using (true);

drop policy if exists "Users can manage own project photos" on project_photos;
create policy "Users can insert own project photos"
  on project_photos for insert to authenticated with check (
    auth.uid() = (select profile_id from projects where id = project_id)
  );
create policy "Users can update own project photos"
  on project_photos for update to authenticated
  using (auth.uid() = (select profile_id from projects where id = project_id))
  with check (auth.uid() = (select profile_id from projects where id = project_id));
create policy "Users can delete own project photos"
  on project_photos for delete to authenticated using (
    auth.uid() = (select profile_id from projects where id = project_id)
  );

create index if not exists idx_projphotos_project on project_photos (project_id, display_order);


-- ── CERTIFICATIONS ────────────────────────────────────────────
create table if not exists certifications (
  id           uuid default gen_random_uuid() primary key,
  profile_id   uuid references profiles on delete cascade not null,
  name         text not null,
  issuing_org  text,
  date_earned  date,
  expiry_date  date,
  created_at   timestamptz default now()
);

alter table certifications enable row level security;

do $$ begin
  alter table certifications add constraint certs_name_len check (char_length(name) <= 200);
exception when duplicate_object then null; end $$;

drop policy if exists "Certifications are publicly readable" on certifications;
create policy "Certifications are publicly readable"
  on certifications for select using (true);

drop policy if exists "Users can manage own certifications" on certifications;
create policy "Users can insert own certifications"
  on certifications for insert to authenticated with check (auth.uid() = profile_id);
create policy "Users can update own certifications"
  on certifications for update to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "Users can delete own certifications"
  on certifications for delete to authenticated using (auth.uid() = profile_id);

create index if not exists idx_certs_profile on certifications (profile_id);


-- ── SUPERVISOR VERIFICATIONS (legacy — feature removed) ──────
-- The table stays for legacy data, but all client access is revoked.
-- The old policies allowed ANONYMOUS insert/update of any row.
create table if not exists supervisor_verifications (
  id               uuid default gen_random_uuid() primary key,
  project_id       uuid references projects on delete cascade not null,
  supervisor_name  text,
  supervisor_email text not null,
  token            uuid unique default gen_random_uuid(),
  verified_at      timestamptz,
  message          text,
  created_at       timestamptz default now()
);

alter table supervisor_verifications enable row level security;

drop policy if exists "Anyone can read verifications" on supervisor_verifications;
drop policy if exists "Anyone can insert verifications" on supervisor_verifications;
drop policy if exists "Anyone can update verifications" on supervisor_verifications;
revoke all on table supervisor_verifications from anon, authenticated;


-- ── MESSAGES ──────────────────────────────────────────────────
create table if not exists messages (
  id           uuid default gen_random_uuid() primary key,
  sender_id    uuid references profiles on delete cascade not null,
  recipient_id uuid references profiles on delete cascade not null,
  content      text not null,
  read_at      timestamptz,
  created_at   timestamptz default now()
);

alter table messages enable row level security;

do $$ begin
  alter table messages add constraint messages_content_len
    check (char_length(content) between 1 and 5000);
exception when duplicate_object then null; end $$;

drop policy if exists "Users can see their own messages" on messages;
create policy "Users can see their own messages"
  on messages for select to authenticated using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );

drop policy if exists "Users can send messages" on messages;
create policy "Users can send messages"
  on messages for insert to authenticated with check (
    auth.uid() = sender_id and sender_id <> recipient_id
  );

drop policy if exists "Recipients can mark messages read" on messages;
create policy "Recipients can mark messages read"
  on messages for update to authenticated
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Recipients may only set read_at — never rewrite content, sender, or
-- recipient of a delivered message.
revoke update on table messages from anon, authenticated;
grant update (read_at) on messages to authenticated;

create index if not exists idx_messages_recipient on messages (recipient_id, created_at desc);
create index if not exists idx_messages_sender on messages (sender_id, created_at desc);


-- ── NOTIFICATIONS ─────────────────────────────────────────────
create table if not exists notifications (
  id         uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles on delete cascade not null,
  type       text check (type in (
               'verification_received',
               'profile_viewed',
               'message_received',
               'project_added'
             )),
  title      text not null,
  body       text,
  read       bool default false,
  link       text,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

drop policy if exists "Users can see own notifications" on notifications;
create policy "Users can see own notifications"
  on notifications for select to authenticated using (auth.uid() = profile_id);

-- The old policy was WITH CHECK (true): any client could inject notifications
-- (with attacker-controlled links) into any user's feed. System notifications
-- should be written with the service role, which bypasses RLS and needs no
-- policy. Clients may only create notifications for themselves.
drop policy if exists "System can insert notifications" on notifications;
create policy "Users can insert own notifications"
  on notifications for insert to authenticated with check (auth.uid() = profile_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications"
  on notifications for update to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create index if not exists idx_notifs_profile on notifications (profile_id, created_at desc);
