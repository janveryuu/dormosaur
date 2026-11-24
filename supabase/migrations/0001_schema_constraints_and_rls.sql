-- Dormosaur baseline schema constraints, indexes, RLS & storage hardening.
-- Additive and idempotent: safe to run on the existing Supabase database.
-- Review before executing in the Supabase SQL Editor.

begin;

-- ─── 1. Ensure Core Tables Exist ──────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  school text not null default '',
  dorm text not null default '',
  year text not null default '',
  avatar_url text,
  initials text not null default '',
  is_dorm_student boolean not null default true,
  onboarding_completed boolean not null default false,
  country text not null default 'PH',
  timezone text not null default 'Asia/Manila',
  appliances text[] not null default '{}',
  dietary_preference text not null default 'none',
  dietary_note text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists dietary_note text not null default '';

create table if not exists public.classes (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default '',
  code text not null default '',
  instructor text not null default '',
  room text not null default '',
  days text[] not null default '{}',
  start_time text not null default '',
  end_time text not null default '',
  color integer not null default 1,
  confidence text not null default 'high',
  low_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.alarms (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id text not null default '',
  subject text not null default '',
  code text not null default '',
  time text not null default '',
  day text not null default 'Mon',
  lead integer not null default 15,
  enabled boolean not null default true,
  color integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.deadlines (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  code text not null default '',
  type text not null default 'assignment',
  due_date timestamptz not null,
  color integer not null default 1,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_plan (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  day text not null,
  meal text not null,
  recipe_slug text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.grocery_items (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  checked boolean not null default false,
  custom boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null default '',
  auth text not null default '',
  device_label text not null default 'Web Browser',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  event_key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed')),
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  success_count integer not null default 0,
  failure_count integer not null default 0
);

create table if not exists public.pro_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('trial', 'monthly', 'semester', 'lifetime')),
  source text not null check (source in ('trial', 'payment', 'manual')),
  payment_id uuid,
  created_by uuid,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'semester', 'lifetime')),
  amount_php integer not null,
  wallet text not null check (wallet in ('gcash', 'maya', 'maribank', 'gotyme')),
  reference_code text not null,
  transaction_ref text not null,
  receipt_path text not null,
  idempotency_key text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('schedule_scan', 'syllabus_scan', 'copilot')),
  period text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, period)
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  description text not null,
  related_user_id uuid,
  performed_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id text primary key default 'global',
  alarm_failure_alerts boolean not null default true,
  weekly_digest_email boolean not null default true,
  new_signup_notifs boolean not null default false,
  require_2fa boolean not null default false,
  auto_suspend_payment boolean not null default false,
  auto_sync_exchange boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ─── 2. Deduplicate & Add Missing Primary Keys / Unique Constraints ───────────

do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['classes', 'alarms', 'deadlines', 'meal_plan', 'grocery_items', 'push_subscriptions'])
  loop
    execute format('delete from public.%I where ctid not in (select min(ctid) from public.%I group by id, user_id)', tbl, tbl);
    if not exists (
      select 1 from pg_constraint where conrelid = format('public.%I', tbl)::regclass and contype = 'p'
    ) then
      execute format('alter table public.%I add primary key (id, user_id)', tbl);
    end if;
  end loop;
end $$;

delete from public.push_subscriptions
where ctid not in (select min(ctid) from public.push_subscriptions group by endpoint);

create unique index if not exists push_subscriptions_endpoint_uidx on public.push_subscriptions (endpoint);
create unique index if not exists pro_entitlements_one_trial_uidx on public.pro_entitlements (user_id) where source = 'trial';
create unique index if not exists pro_entitlements_payment_uidx on public.pro_entitlements (payment_id) where payment_id is not null;
create unique index if not exists pro_payments_one_pending_uidx on public.pro_payments (user_id) where status = 'pending';
create unique index if not exists pro_payments_txn_ref_uidx on public.pro_payments (transaction_ref);
create unique index if not exists pro_payments_idempotency_uidx on public.pro_payments (user_id, idempotency_key);

create index if not exists classes_user_idx on public.classes (user_id);
create index if not exists alarms_user_idx on public.alarms (user_id);
create index if not exists deadlines_user_due_idx on public.deadlines (user_id, due_date);
create index if not exists meal_plan_user_idx on public.meal_plan (user_id);
create index if not exists grocery_items_user_idx on public.grocery_items (user_id);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
create index if not exists pro_entitlements_user_ends_idx on public.pro_entitlements (user_id, ends_at);
create index if not exists pro_payments_status_created_idx on public.pro_payments (status, created_at);
create index if not exists notification_deliveries_user_claimed_idx on public.notification_deliveries (user_id, claimed_at desc);
create index if not exists activity_log_type_created_idx on public.activity_log (event_type, created_at desc);

-- ─── 3. Enable RLS & Owner/Service-Role Policies on All 13 Tables ─────────────

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.alarms enable row level security;
alter table public.deadlines enable row level security;
alter table public.meal_plan enable row level security;
alter table public.grocery_items enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.pro_entitlements enable row level security;
alter table public.pro_payments enable row level security;
alter table public.pro_usage enable row level security;
alter table public.activity_log enable row level security;
alter table public.admin_settings enable row level security;

-- Prevent clients (authenticated / anon) from setting or mutating profiles.is_admin.
create or replace function public.protect_profile_admin_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      new.is_admin := false;
    elsif new.is_admin is distinct from old.is_admin then
      raise exception 'Administrator privileges cannot be modified from client requests.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_admin_column on public.profiles;
create trigger trg_protect_profile_admin_column
  before insert or update on public.profiles
  for each row execute function public.protect_profile_admin_column();

drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['classes', 'alarms', 'deadlines', 'meal_plan', 'grocery_items', 'push_subscriptions'])
  loop
    execute format('drop policy if exists %I on public.%I', tbl || '_owner_all', tbl);
    execute format(
      'create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl || '_owner_all',
      tbl
    );
  end loop;
end $$;

-- Service-role-only backend/ledger tables (deny anon & authenticated completely).
revoke all on public.notification_deliveries from public, anon, authenticated;
revoke all on public.pro_entitlements from public, anon, authenticated;
revoke all on public.pro_payments from public, anon, authenticated;
revoke all on public.pro_usage from public, anon, authenticated;
revoke all on public.activity_log from public, anon, authenticated;
revoke all on public.admin_settings from public, anon, authenticated;

grant select, insert, update on public.notification_deliveries to service_role;
grant all on public.pro_entitlements to service_role;
grant all on public.pro_payments to service_role;
grant all on public.pro_usage to service_role;
grant all on public.activity_log to service_role;
grant all on public.admin_settings to service_role;

-- ─── 4. Private Storage Buckets (Signed URLs only via service_role) ──────────

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false), ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "receipts_public_read" on storage.objects;

commit;
