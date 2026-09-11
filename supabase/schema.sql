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

-- Username format: 3-30 chars from signup, or the 37-char 'user-'+32hex
-- fallback the signup trigger assigns on a username collision. The upper bound
-- MUST cover that fallback (len('user-') + 32 = 37) — a tighter cap makes the
-- fallback insert raise check_violation, which the trigger's unique_violation
-- handler doesn't catch, aborting the whole signup. Bound at 41 for headroom.
-- Drop-then-add (not a duplicate_object guard) so re-running actually widens an
-- existing 36-char constraint instead of silently skipping it.
alter table profiles drop constraint if exists profiles_username_format;
alter table profiles add constraint profiles_username_format
  check (char_length(username) between 3 and 41 and username ~ '^[a-z0-9_-]+$');

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
drop policy if exists "Users can insert own work experience" on work_experience;
drop policy if exists "Users can update own work experience" on work_experience;
drop policy if exists "Users can delete own work experience" on work_experience;
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
drop policy if exists "Users can insert own projects" on projects;
drop policy if exists "Users can update own projects" on projects;
drop policy if exists "Users can delete own projects" on projects;
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
drop policy if exists "Users can insert own project photos" on project_photos;
drop policy if exists "Users can update own project photos" on project_photos;
drop policy if exists "Users can delete own project photos" on project_photos;
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
drop policy if exists "Users can insert own certifications" on certifications;
drop policy if exists "Users can update own certifications" on certifications;
drop policy if exists "Users can delete own certifications" on certifications;
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
drop policy if exists "Users can insert own notifications" on notifications;
create policy "Users can insert own notifications"
  on notifications for insert to authenticated with check (auth.uid() = profile_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications"
  on notifications for update to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create index if not exists idx_notifs_profile on notifications (profile_id, created_at desc);


-- ══════════════════════════════════════════════════════════════
-- COLLABORATION, CONNECTIONS, FEED (added)
-- All state transitions go through SECURITY DEFINER RPCs with explicit
-- auth.uid() checks — clients get SELECT only on the sensitive tables, so a
-- direct PostgREST call can't forge a membership or self-approve a request.
-- ══════════════════════════════════════════════════════════════


-- ── CONNECTIONS ───────────────────────────────────────────────
-- A directed request that doubles as a one-way follow: the requester follows
-- the addressee while status='pending'; on 'accepted' they are mutually
-- connected. The "connected list" = accepted rows in either direction.
create table if not exists connections (
  id           uuid default gen_random_uuid() primary key,
  requester_id uuid references profiles on delete cascade not null,
  addressee_id uuid references profiles on delete cascade not null,
  status       text not null default 'pending' check (status in ('pending','accepted')),
  created_at   timestamptz default now(),
  responded_at timestamptz,
  constraint connections_no_self check (requester_id <> addressee_id),
  constraint connections_unique_pair unique (requester_id, addressee_id)
);

alter table connections enable row level security;

-- Only the two parties can see the edge (keeps the social graph private).
drop policy if exists "Parties can see their connections" on connections;
create policy "Parties can see their connections"
  on connections for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- You may only create your own outgoing request (which is also a follow).
drop policy if exists "Users can send connection requests" on connections;
create policy "Users can send connection requests"
  on connections for insert to authenticated
  with check (auth.uid() = requester_id and status = 'pending' and requester_id <> addressee_id);

-- Only the addressee may accept; the column grant below limits them to the
-- status/responded_at columns so they can't re-point the edge.
drop policy if exists "Addressee can accept" on connections;
create policy "Addressee can accept"
  on connections for update to authenticated
  using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);

-- Either party can remove the edge (withdraw / decline / disconnect).
drop policy if exists "Either party can remove connection" on connections;
create policy "Either party can remove connection"
  on connections for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

revoke update on table connections from anon, authenticated;
grant update (status, responded_at) on connections to authenticated;

create index if not exists idx_conn_requester on connections (requester_id, status);
create index if not exists idx_conn_addressee on connections (addressee_id, status);


-- ── PROJECT COLLABORATORS ─────────────────────────────────────
-- The project owner is projects.profile_id. This table holds *additional*
-- contributors. status: 'invited' (owner invited, awaiting invitee),
-- 'requested' (user asked to join, awaiting owner), 'accepted' (active).
-- Each collaborator writes their own `contribution` blurb, shown on THEIR
-- profile for this project.
create table if not exists project_collaborators (
  id           uuid default gen_random_uuid() primary key,
  project_id   uuid references projects on delete cascade not null,
  profile_id   uuid references profiles on delete cascade not null,
  status       text not null default 'invited' check (status in ('invited','requested','accepted')),
  contribution text check (contribution is null or char_length(contribution) <= 2000),
  invited_by   uuid references profiles on delete set null,
  created_at   timestamptz default now(),
  responded_at timestamptz,
  constraint pc_unique unique (project_id, profile_id)
);

alter table project_collaborators enable row level security;

-- Accepted collaborators are public (co-contributors show on public profiles);
-- pending invites/requests are visible only to the owner and the invitee.
drop policy if exists "Collaborators visibility" on project_collaborators;
create policy "Collaborators visibility"
  on project_collaborators for select using (
    status = 'accepted'
    or auth.uid() = profile_id
    or auth.uid() = (select profile_id from projects where id = project_id)
  );

-- No direct client writes: every insert/transition/delete goes through the
-- SECURITY DEFINER RPCs below (revoke leaves only the SELECT policy in force).
revoke insert, update, delete on table project_collaborators from anon, authenticated;

create index if not exists idx_pc_project on project_collaborators (project_id, status);
create index if not exists idx_pc_profile on project_collaborators (profile_id, status);

-- helper: is `a` connected (accepted, either direction) to `b`?
create or replace function are_connected(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from connections
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b)
        or (requester_id = b and addressee_id = a))
  );
$$;

-- Owner invites a connection to their project.
create or replace function invite_collaborator(p_project uuid, p_profile uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select profile_id into v_owner from projects where id = p_project;
  if v_owner is null then raise exception 'Project not found'; end if;
  if v_owner <> auth.uid() then raise exception 'Only the owner can invite'; end if;
  if p_profile = v_owner then raise exception 'Owner is already on the project'; end if;
  if not are_connected(auth.uid(), p_profile) then raise exception 'You can only invite your connections'; end if;
  insert into project_collaborators (project_id, profile_id, status, invited_by)
    values (p_project, p_profile, 'invited', auth.uid())
    on conflict (project_id, profile_id) do nothing;
end; $$;

-- A connection of the owner asks to join.
create or replace function request_to_join(p_project uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select profile_id into v_owner from projects where id = p_project;
  if v_owner is null then raise exception 'Project not found'; end if;
  if v_owner = auth.uid() then raise exception 'You own this project'; end if;
  if not are_connected(auth.uid(), v_owner) then raise exception 'Connect with the owner first'; end if;
  insert into project_collaborators (project_id, profile_id, status, invited_by)
    values (p_project, auth.uid(), 'requested', auth.uid())
    on conflict (project_id, profile_id) do nothing;
end; $$;

-- Invitee accepts/declines an invite.
create or replace function respond_to_invite(p_collab uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_profile uuid; v_status text;
begin
  select profile_id, status into v_profile, v_status from project_collaborators where id = p_collab;
  if v_profile is null then raise exception 'Invite not found'; end if;
  if v_profile <> auth.uid() then raise exception 'Not your invite'; end if;
  if v_status <> 'invited' then raise exception 'Invite is no longer pending'; end if;
  if p_accept then
    update project_collaborators set status = 'accepted', responded_at = now() where id = p_collab;
  else
    delete from project_collaborators where id = p_collab;
  end if;
end; $$;

-- Owner approves/denies a join request.
create or replace function respond_to_join_request(p_collab uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_status text;
begin
  select p.profile_id, pc.status into v_owner, v_status
    from project_collaborators pc join projects p on p.id = pc.project_id
    where pc.id = p_collab;
  if v_owner is null then raise exception 'Request not found'; end if;
  if v_owner <> auth.uid() then raise exception 'Only the owner can respond'; end if;
  if v_status <> 'requested' then raise exception 'Request is no longer pending'; end if;
  if p_accept then
    update project_collaborators set status = 'accepted', responded_at = now() where id = p_collab;
  else
    delete from project_collaborators where id = p_collab;
  end if;
end; $$;

-- A collaborator edits their own contribution blurb.
create or replace function update_my_contribution(p_collab uuid, p_text text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_profile uuid; v_status text;
begin
  select profile_id, status into v_profile, v_status from project_collaborators where id = p_collab;
  if v_profile is null or v_profile <> auth.uid() then raise exception 'Not your collaboration'; end if;
  if v_status <> 'accepted' then raise exception 'Not an active collaborator'; end if;
  if p_text is not null and char_length(p_text) > 2000 then raise exception 'Contribution too long'; end if;
  update project_collaborators set contribution = nullif(btrim(p_text), '') where id = p_collab;
end; $$;

-- Owner removes a collaborator, or a collaborator leaves.
create or replace function remove_collaborator(p_collab uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_profile uuid;
begin
  select p.profile_id, pc.profile_id into v_owner, v_profile
    from project_collaborators pc join projects p on p.id = pc.project_id
    where pc.id = p_collab;
  if v_owner is null then raise exception 'Not found'; end if;
  if auth.uid() <> v_owner and auth.uid() <> v_profile then raise exception 'Not allowed'; end if;
  delete from project_collaborators where id = p_collab;
end; $$;

revoke execute on function invite_collaborator(uuid,uuid), request_to_join(uuid),
  respond_to_invite(uuid,boolean), respond_to_join_request(uuid,boolean),
  update_my_contribution(uuid,text), remove_collaborator(uuid), are_connected(uuid,uuid) from anon;
grant execute on function invite_collaborator(uuid,uuid), request_to_join(uuid),
  respond_to_invite(uuid,boolean), respond_to_join_request(uuid,boolean),
  update_my_contribution(uuid,text), remove_collaborator(uuid), are_connected(uuid,uuid) to authenticated;


-- ── PROJECT PHOTOS: collaborator uploads ──────────────────────
alter table project_photos add column if not exists uploaded_by uuid references profiles on delete set null;

-- Owner OR an accepted collaborator may add photos; the row must be attributed
-- to the uploader. (Owner-only delete stays below — collaborators can only add.)
drop policy if exists "Users can insert own project photos" on project_photos;
drop policy if exists "Owner or collaborator can add photos" on project_photos;
create policy "Owner or collaborator can add photos"
  on project_photos for insert to authenticated with check (
    uploaded_by = auth.uid()
    and (
      auth.uid() = (select profile_id from projects where id = project_id)
      or exists (
        select 1 from project_collaborators pc
        where pc.project_id = project_photos.project_id
          and pc.profile_id = auth.uid() and pc.status = 'accepted'
      )
    )
  );

-- Only the project owner can delete photos (nobody else — collaborators add only).
drop policy if exists "Users can delete own project photos" on project_photos;
drop policy if exists "Only owner can delete photos" on project_photos;
create policy "Only owner can delete photos"
  on project_photos for delete to authenticated using (
    auth.uid() = (select profile_id from projects where id = project_id)
  );

create index if not exists idx_projphotos_uploader on project_photos (uploaded_by);


-- ── PROJECT LIKES ─────────────────────────────────────────────
create table if not exists project_likes (
  project_id uuid references projects on delete cascade not null,
  profile_id uuid references profiles on delete cascade not null,
  created_at timestamptz default now(),
  primary key (project_id, profile_id)
);

alter table project_likes enable row level security;

drop policy if exists "Likes are publicly readable" on project_likes;
create policy "Likes are publicly readable" on project_likes for select using (true);
drop policy if exists "Users can like" on project_likes;
create policy "Users can like" on project_likes for insert to authenticated
  with check (auth.uid() = profile_id);
drop policy if exists "Users can unlike" on project_likes;
create policy "Users can unlike" on project_likes for delete to authenticated
  using (auth.uid() = profile_id);

create index if not exists idx_likes_project on project_likes (project_id);


-- ── PROJECT COMMENTS ──────────────────────────────────────────
create table if not exists project_comments (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  profile_id uuid references profiles on delete cascade not null,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz default now()
);

alter table project_comments enable row level security;

drop policy if exists "Comments are publicly readable" on project_comments;
create policy "Comments are publicly readable" on project_comments for select using (true);
drop policy if exists "Users can comment" on project_comments;
create policy "Users can comment" on project_comments for insert to authenticated
  with check (auth.uid() = profile_id);
-- A comment can be removed by its author OR by the project owner (moderation).
drop policy if exists "Author or project owner can delete comment" on project_comments;
create policy "Author or project owner can delete comment"
  on project_comments for delete to authenticated using (
    auth.uid() = profile_id
    or auth.uid() = (select profile_id from projects where id = project_id)
  );

create index if not exists idx_comments_project on project_comments (project_id, created_at desc);


-- ── TRACKER: who you work with most ───────────────────────────
-- For `target`, everyone who shares a project (owned or accepted-collab) with
-- them, ranked by distinct shared projects. All inputs are public.
create or replace function top_collaborators(target uuid, lim int default 20)
returns table (profile_id uuid, shared_count bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  with my_projects as (
    select id from projects where profile_id = target
    union
    select project_id from project_collaborators where profile_id = target and status = 'accepted'
  ),
  participants as (
    select p.profile_id as pid, p.id as proj
      from projects p join my_projects mp on p.id = mp.id
    union all
    select pc.profile_id as pid, pc.project_id as proj
      from project_collaborators pc join my_projects mp on pc.project_id = mp.id
      where pc.status = 'accepted'
  )
  select pid as profile_id, count(distinct proj) as shared_count
  from participants
  where pid <> target
  group by pid
  order by shared_count desc, pid
  limit lim;
$$;
grant execute on function top_collaborators(uuid, int) to anon, authenticated;


-- ══════════════════════════════════════════════════════════════
-- PREMIUM (billing) + REFERRALS (added)
-- Entitlement = an active Stripe subscription OR a comped premium_until in the
-- future. Referral rewards grant comped months via premium_until, so they work
-- with no Stripe configured. Stripe subscription rows are written only by the
-- webhook (service role, bypasses RLS); clients get SELECT.
-- ══════════════════════════════════════════════════════════════

-- Premium fields on profiles. Neither is in the client UPDATE grant above, so
-- users cannot set their own premium/comped state — only the definer RPCs and
-- the webhook (service role) can.
alter table profiles add column if not exists premium_until timestamptz;
alter table profiles add column if not exists referral_code text;
create unique index if not exists idx_profiles_referral_code on profiles (referral_code);


-- ── SUBSCRIPTIONS (Stripe-managed) ────────────────────────────
create table if not exists subscriptions (
  profile_id            uuid references profiles on delete cascade primary key,
  stripe_customer_id    text,
  stripe_subscription_id text,
  status                text,           -- active, trialing, past_due, canceled, ...
  price_id              text,
  current_period_end    timestamptz,
  cancel_at_period_end  bool default false,
  updated_at            timestamptz default now()
);

alter table subscriptions enable row level security;

drop policy if exists "Users can see own subscription" on subscriptions;
create policy "Users can see own subscription"
  on subscriptions for select to authenticated using (auth.uid() = profile_id);

-- No client writes: the Stripe webhook upserts these with the service role.
revoke insert, update, delete on table subscriptions from anon, authenticated;

create index if not exists idx_subs_customer on subscriptions (stripe_customer_id);


-- ── PREMIUM ENTITLEMENT CHECK ─────────────────────────────────
-- True if the user has a live Stripe subscription OR a comped month that hasn't
-- expired. Definer so it can read subscriptions regardless of the caller.
create or replace function is_premium(p_profile uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select
    coalesce((select premium_until from profiles where id = p_profile), 'epoch'::timestamptz) > now()
    or exists (
      select 1 from subscriptions s
      where s.profile_id = p_profile
        and s.status in ('active', 'trialing')
        and coalesce(s.current_period_end, 'epoch'::timestamptz) > now()
    );
$$;
grant execute on function is_premium(uuid) to anon, authenticated;


-- ── REFERRALS ─────────────────────────────────────────────────
create table if not exists referrals (
  id           uuid default gen_random_uuid() primary key,
  referrer_id  uuid references profiles on delete cascade not null,
  referred_id  uuid references profiles on delete cascade not null unique, -- one reward per referred person
  code_used    text,
  status       text not null default 'pending'
                 check (status in ('pending', 'rewarded', 'pending_review', 'rejected')),
  created_at   timestamptz default now(),
  activated_at timestamptz,
  rewarded_at  timestamptz,
  constraint referrals_no_self check (referrer_id <> referred_id)
);

alter table referrals enable row level security;

-- Both parties can see referral rows involving them; no client writes (RPCs only).
drop policy if exists "See own referrals" on referrals;
create policy "See own referrals"
  on referrals for select to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

revoke insert, update, delete on table referrals from anon, authenticated;

create index if not exists idx_referrals_referrer on referrals (referrer_id, status);

-- Get (or lazily create) the calling user's referral code.
create or replace function get_or_create_my_referral_code()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_code text; v_existing text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select referral_code into v_existing from profiles where id = auth.uid();
  if v_existing is not null then return v_existing; end if;
  -- generate a short unique code, retry on collision
  for i in 1..10 loop
    v_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      update profiles set referral_code = v_code where id = auth.uid();
      return v_code;
    exception when unique_violation then
      -- try again
    end;
  end loop;
  raise exception 'Could not generate referral code';
end; $$;

-- Record that the calling (newly signed-up) user was referred via a code.
-- No-ops safely if the code is invalid, self-referral, or a row already exists.
create or replace function record_referral(p_code text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_referrer uuid;
begin
  if auth.uid() is null or p_code is null then return; end if;
  select id into v_referrer from profiles where referral_code = lower(btrim(p_code));
  if v_referrer is null or v_referrer = auth.uid() then return; end if;
  insert into referrals (referrer_id, referred_id, code_used, status)
    values (v_referrer, auth.uid(), lower(btrim(p_code)), 'pending')
  on conflict (referred_id) do nothing;
end; $$;

-- Extend a profile's comped premium by one month from whichever is later.
create or replace function grant_free_month(p_profile uuid)
returns void language sql security definer set search_path = public, pg_temp as $$
  update profiles
     set premium_until = greatest(coalesce(premium_until, now()), now()) + interval '1 month'
   where id = p_profile;
$$;

-- Called after the referred user does something meaningful. If they now meet the
-- "active" bar and a pending referral exists, grant the referrer a free month —
-- unless the referrer already hit the monthly cap, in which case flag for review.
create or replace function maybe_grant_referral_reward()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ref referrals%rowtype; v_active boolean; v_recent int; v_cap int := 5;
begin
  if auth.uid() is null then return; end if;
  select * into v_ref from referrals where referred_id = auth.uid() and status = 'pending';
  if not found then return; end if;

  -- "active" = onboarding complete AND at least one project with a real photo.
  select (p.onboarding_complete
          and exists (select 1 from projects pr where pr.profile_id = auth.uid() and pr.cover_photo_url is not null))
    into v_active
    from profiles p where p.id = auth.uid();
  if not coalesce(v_active, false) then return; end if;

  -- Monthly cap: at most v_cap rewards granted to this referrer in the last 30 days.
  select count(*) into v_recent
    from referrals
   where referrer_id = v_ref.referrer_id and status = 'rewarded'
     and rewarded_at > now() - interval '30 days';

  if v_recent >= v_cap then
    update referrals set status = 'pending_review', activated_at = now() where id = v_ref.id;
    return;
  end if;

  perform grant_free_month(v_ref.referrer_id);
  update referrals set status = 'rewarded', activated_at = now(), rewarded_at = now() where id = v_ref.id;
  insert into notifications (profile_id, type, title, body, link)
  values (v_ref.referrer_id, 'referral_reward', 'You earned a free month of Premium',
    'A referral just became active.', '/premium');
end; $$;

revoke execute on function get_or_create_my_referral_code(), record_referral(text),
  maybe_grant_referral_reward() from anon;
grant execute on function get_or_create_my_referral_code(), record_referral(text),
  maybe_grant_referral_reward() to authenticated;
-- grant_free_month is internal only.
revoke execute on function grant_free_month(uuid) from anon, authenticated;


-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS: auto-generate on social events (added)
-- Triggers run SECURITY DEFINER so they can write a notification row for the
-- TARGET user (past the "own rows only" insert policy). type is free text now.
-- ══════════════════════════════════════════════════════════════

alter table notifications drop constraint if exists notifications_type_check;

create or replace function _display_name(p uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(nullif(full_name, ''), username, 'Someone') from profiles where id = p;
$$;

-- Connections: request -> notify addressee; accepted -> notify requester.
create or replace function notify_connection()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if TG_OP = 'INSERT' then
    insert into notifications (profile_id, type, title, body, link)
    values (NEW.addressee_id, 'connection_request',
      _display_name(NEW.requester_id) || ' wants to connect', null, '/connections');
  elsif TG_OP = 'UPDATE' and NEW.status = 'accepted' and OLD.status <> 'accepted' then
    insert into notifications (profile_id, type, title, body, link)
    values (NEW.requester_id, 'connection_accepted',
      _display_name(NEW.addressee_id) || ' accepted your connection', null,
      '/' || (select username from profiles where id = NEW.addressee_id));
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_connection on connections;
create trigger trg_notify_connection after insert or update on connections
  for each row execute procedure notify_connection();

-- Collaborators: invite/request -> notify the other party; accepted -> notify.
create or replace function notify_collaborator()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_title text;
begin
  select p.profile_id, p.title into v_owner, v_title from projects p where p.id = NEW.project_id;
  if TG_OP = 'INSERT' then
    if NEW.status = 'invited' then
      insert into notifications (profile_id, type, title, body, link)
      values (NEW.profile_id, 'project_invite',
        _display_name(v_owner) || ' invited you to collaborate', v_title, '/projects/' || NEW.project_id);
    elsif NEW.status = 'requested' then
      insert into notifications (profile_id, type, title, body, link)
      values (v_owner, 'join_request',
        _display_name(NEW.profile_id) || ' asked to join your project', v_title, '/projects/' || NEW.project_id);
    end if;
  elsif TG_OP = 'UPDATE' and NEW.status = 'accepted' and OLD.status <> 'accepted' then
    if OLD.status = 'invited' then
      insert into notifications (profile_id, type, title, body, link)
      values (v_owner, 'join_approved',
        _display_name(NEW.profile_id) || ' joined your project', v_title, '/projects/' || NEW.project_id);
    elsif OLD.status = 'requested' then
      insert into notifications (profile_id, type, title, body, link)
      values (NEW.profile_id, 'join_approved',
        'You joined ' || coalesce(v_title, 'a project'), null, '/projects/' || NEW.project_id);
    end if;
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_collaborator on project_collaborators;
create trigger trg_notify_collaborator after insert or update on project_collaborators
  for each row execute procedure notify_collaborator();

-- Likes -> notify the project owner (not on your own like).
create or replace function notify_like()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_title text;
begin
  select p.profile_id, p.title into v_owner, v_title from projects p where p.id = NEW.project_id;
  if v_owner is not null and v_owner <> NEW.profile_id then
    insert into notifications (profile_id, type, title, body, link)
    values (v_owner, 'project_liked', _display_name(NEW.profile_id) || ' liked your project',
      v_title, '/projects/' || NEW.project_id);
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_like on project_likes;
create trigger trg_notify_like after insert on project_likes for each row execute procedure notify_like();

-- Comments -> notify the project owner (not on your own comment).
create or replace function notify_comment()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_title text;
begin
  select p.profile_id, p.title into v_owner, v_title from projects p where p.id = NEW.project_id;
  if v_owner is not null and v_owner <> NEW.profile_id then
    insert into notifications (profile_id, type, title, body, link)
    values (v_owner, 'project_comment', _display_name(NEW.profile_id) || ' commented on your project',
      left(NEW.content, 120), '/projects/' || NEW.project_id);
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_comment on project_comments;
create trigger trg_notify_comment after insert on project_comments for each row execute procedure notify_comment();
