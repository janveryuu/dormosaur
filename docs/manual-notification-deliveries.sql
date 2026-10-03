-- REVIEW / APPROVAL REQUIRED. Not applied by the hardening pass.
-- Additive delivery ledger; existing tables and student rows are not modified.
begin;
create table if not exists public.notification_deliveries (
  event_key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed')),
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  success_count integer not null default 0,
  failure_count integer not null default 0
);
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from public, anon, authenticated;
grant select, insert, update on public.notification_deliveries to service_role;
-- The unique key is the atomic claim; retrying cron cannot send it twice.
-- Claims are deliberately not released automatically after a crash/send failure.
-- Review failed/old claimed events manually before any retry to avoid duplicate pushes.
commit;
