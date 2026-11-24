# Supabase Database Verification Runbook

Apply the tracked SQL migrations in order inside the **Supabase Dashboard → SQL Editor** (or `supabase db push` once linked):

1. [`supabase/migrations/0001_schema_constraints_and_rls.sql`](../supabase/migrations/0001_schema_constraints_and_rls.sql) — Primary keys, deduplication, indexes, private storage buckets, and RLS policies on all 13 tables.
2. [`supabase/migrations/0002_pro_atomic_rpcs.sql`](../supabase/migrations/0002_pro_atomic_rpcs.sql) — Advisory-locked quota & atomic Pro billing RPCs (`pro_consume`, `pro_refund`, `pro_grant_plan`, `pro_review_payment`).

## Post-Apply Verification Queries

Run these read-only checks in Supabase SQL Editor after applying both migrations:

```sql
-- 1. Confirm RLS is enabled on all 13 public tables
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;

-- 2. Confirm primary keys exist on all collection tables
select tc.table_name, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
where tc.table_schema = 'public'
  and tc.constraint_type = 'PRIMARY KEY'
order by tc.table_name;

-- 3. Confirm atomic Pro RPCs exist and are not executable by anon/authenticated
select p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_exec
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in ('pro_consume', 'pro_refund', 'pro_grant_plan', 'pro_review_payment', 'protect_profile_admin_column');

-- 4. Confirm avatars & receipts storage buckets are private
select id, public from storage.buckets where id in ('avatars', 'receipts');
```

## Required Production Environment Variables

- Enable **Confirm email** in **Supabase Dashboard → Authentication → Providers → Email**.
- Add `ADMIN_ALLOWED_EMAILS` (comma-separated admin emails) and `ADMIN_ALERT_EMAIL` in Vercel Project Settings.
- Configure an external 5-minute scheduler (GitHub Actions / cron-job.org / Vercel Pro `*/5 * * * *`) to `GET /api/notifications/cron` with `Authorization: Bearer <CRON_SECRET>` so 15/30/60-minute class and deadline alerts fire on time.
