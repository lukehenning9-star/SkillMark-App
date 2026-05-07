-- ──────────────────────────────────────────────────────────────
-- SkillMark Database Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- ──────────────────────────────────────────────────────────────


-- ── PROFILES ──────────────────────────────────────────────────
create table if not exists profiles (
  id                     uuid references auth.users on delete cascade primary key,
  username               text unique not null,
  full_name              text,
  headline               text,
  bio                    text check (char_length(bio) <= 300),
  avatar_url             text,
  banner_url             text,
  trade                  text,
  experience_level       text check (experience_level in ('apprentice', 'journeyman', 'master')),
  years_experience       int default 0,
  city                   text,
  state                  text,
  is_available           bool default true,
  profile_views          int default 0,
  verified_project_count int default 0,
  dark_mode_preference   bool default false,
  onboarding_complete    bool default false,
  created_at             timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);


-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.id::text),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

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

create policy "Work experience is publicly readable"
  on work_experience for select using (true);

create policy "Users can manage own work experience"
  on work_experience for all using (auth.uid() = profile_id);


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
  verification_status text default 'unverified'
                        check (verification_status in ('unverified', 'pending', 'verified')),
  supervisor_name     text,
  supervisor_email    text,
  verification_token  uuid unique default gen_random_uuid(),
  verified_at         timestamptz,
  created_at          timestamptz default now()
);

alter table projects enable row level security;

create policy "Projects are publicly readable"
  on projects for select using (true);

create policy "Users can manage own projects"
  on projects for all using (auth.uid() = profile_id);


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

create policy "Project photos are publicly readable"
  on project_photos for select using (true);

create policy "Users can manage own project photos"
  on project_photos for all using (
    auth.uid() = (select profile_id from projects where id = project_id)
  );


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

create policy "Certifications are publicly readable"
  on certifications for select using (true);

create policy "Users can manage own certifications"
  on certifications for all using (auth.uid() = profile_id);


-- ── SUPERVISOR VERIFICATIONS ──────────────────────────────────
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

-- Public read/write — supervisors verify via token without being logged in
create policy "Anyone can read verifications"
  on supervisor_verifications for select using (true);

create policy "Anyone can insert verifications"
  on supervisor_verifications for insert with check (true);

create policy "Anyone can update verifications"
  on supervisor_verifications for update using (true);


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

create policy "Users can see their own messages"
  on messages for select using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );

create policy "Users can send messages"
  on messages for insert with check (auth.uid() = sender_id);

create policy "Recipients can mark messages read"
  on messages for update using (auth.uid() = recipient_id);


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

create policy "Users can see own notifications"
  on notifications for select using (auth.uid() = profile_id);

create policy "System can insert notifications"
  on notifications for insert with check (true);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = profile_id);
