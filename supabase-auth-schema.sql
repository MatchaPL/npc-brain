-- NPC — LINE authentication, organizations, invitations, and membership.
-- Run in the Supabase SQL Editor. Pairs with the RAG schema in supabase-schema.sql.
-- The MVP UI drives this through a client store; wire the real API to these tables
-- (see docs/AUTH.md for endpoints and security requirements).

create extension if not exists pgcrypto;

-- ── users (one per LINE identity) ─────────────────────────────────────────────
create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  line_user_id      text unique not null,          -- from a validated LINE ID token
  display_name      text,
  profile_image_url text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── organizations ─────────────────────────────────────────────────────────────
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid not null references users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── membership ────────────────────────────────────────────────────────────────
create type member_role   as enum ('Owner', 'Admin', 'Member');
create type member_status as enum ('Active', 'Pending approval', 'Invited', 'Rejected', 'Suspended');
create type department     as enum ('HR', 'Finance', 'Production', 'Engineering', 'Safety', 'Other');

create table if not exists organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  role            member_role   not null default 'Member',
  department      department,
  job_title       text,
  status          member_status not null default 'Active',
  approved_by     uuid references users(id),
  approved_at     timestamptz,
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)              -- one membership per user per org
);

-- ── invitations (token stored hashed, never in plaintext) ─────────────────────
create table if not exists organization_invitations (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  token_hash         text not null,               -- sha-256 of the raw token
  created_by         uuid not null references users(id),
  default_role       member_role not null default 'Member',
  default_department department,
  default_job_title  text,
  expires_at         timestamptz not null,
  max_uses           int,                          -- null = unlimited; 1 = single-use
  use_count          int not null default 0,
  revoked_at         timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists idx_invitations_token on organization_invitations(token_hash);
create index if not exists idx_invitations_org   on organization_invitations(organization_id);

-- ── join requests ─────────────────────────────────────────────────────────────
create type request_status as enum ('pending', 'approved', 'rejected');

create table if not exists join_requests (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  invitation_id         uuid references organization_invitations(id) on delete set null,
  user_id               uuid not null references users(id) on delete cascade,
  requested_role        member_role default 'Member',
  requested_department  department,
  requested_job_title   text,
  status                request_status not null default 'pending',
  reviewed_by           uuid references users(id),
  reviewed_at           timestamptz,
  rejection_reason      text,
  created_at            timestamptz not null default now()
);
-- at most one pending request per user per org
create unique index if not exists idx_join_pending_unique
  on join_requests(organization_id, user_id) where status = 'pending';

-- ── notifications ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  recipient_user_id  uuid not null references users(id) on delete cascade,
  type               text not null,               -- join_request | invite_accepted | member_role_updated | document
  title              text not null,
  message            text,
  reference_type     text,                         -- e.g. 'join_request'
  reference_id       uuid,
  is_read            boolean not null default false,
  resolved_at        timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists idx_notifications_recipient
  on notifications(recipient_user_id, is_read, created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Enforce org isolation: a member may only read rows for organizations they
-- belong to. Writes (invite / approve / role change) go through server routes
-- using the service role, which additionally checks Owner/Admin authorization.
alter table organizations          enable row level security;
alter table organization_members   enable row level security;
alter table organization_invitations enable row level security;
alter table join_requests          enable row level security;
alter table notifications          enable row level security;

-- Example policy (service role bypasses RLS; app.current_user_id is set per request):
-- create policy "members read their org" on organization_members
--   for select using (
--     organization_id in (
--       select organization_id from organization_members
--       where user_id = current_setting('app.current_user_id', true)::uuid
--         and status = 'Active'
--     )
--   );
