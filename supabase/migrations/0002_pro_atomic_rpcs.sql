-- Atomic Dormosaur Pro quota & billing RPCs.
-- Wraps quota checks, stacked period calculation, and payment review in single DB transactions.

begin;

create or replace function public.pro_consume(
  p_user uuid,
  p_feature text,
  p_period text,
  p_limit integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('pro_usage:' || p_user::text || ':' || p_feature || ':' || p_period));

  insert into public.pro_usage (user_id, feature, period, count)
  values (p_user, p_feature, p_period, 0)
  on conflict (user_id, feature, period) do nothing;

  select count into v_count
  from public.pro_usage
  where user_id = p_user and feature = p_feature and period = p_period
  for update;

  if v_count >= p_limit then
    return -1;
  end if;

  update public.pro_usage
  set count = v_count + 1, updated_at = now()
  where user_id = p_user and feature = p_feature and period = p_period
  returning count into v_count;

  return v_count;
end;
$$;

create or replace function public.pro_refund(
  p_user uuid,
  p_feature text,
  p_period text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('pro_usage:' || p_user::text || ':' || p_feature || ':' || p_period));
  update public.pro_usage
  set count = greatest(0, count - 1), updated_at = now()
  where user_id = p_user and feature = p_feature and period = p_period;
end;
$$;

create or replace function public.pro_grant_plan(
  p_user uuid,
  p_plan text,
  p_source text,
  p_payment_id uuid default null,
  p_by uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_days integer;
  v_starts timestamptz;
  v_ends timestamptz;
  v_id uuid;
begin
  if p_plan not in ('monthly', 'semester', 'lifetime') then
    raise exception 'Unsupported Pro plan: %', p_plan using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('pro:' || p_user::text));

  if p_payment_id is not null then
    select id into v_id
    from public.pro_entitlements
    where payment_id = p_payment_id
    limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  v_days := case p_plan
    when 'monthly' then 30
    when 'semester' then 183
    else null
  end;

  select greatest(v_now, coalesce(max(ends_at), v_now)) into v_starts
  from public.pro_entitlements
  where user_id = p_user
    and revoked_at is null
    and (ends_at is null or ends_at > v_now);

  if v_days is null then
    v_starts := v_now;
    v_ends := null;
  else
    v_ends := v_starts + make_interval(days => v_days);
  end if;

  insert into public.pro_entitlements (user_id, plan, source, payment_id, created_by, starts_at, ends_at)
  values (p_user, p_plan, p_source, p_payment_id, p_by, v_starts, v_ends)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.pro_review_payment(
  p_payment_id uuid,
  p_action text,
  p_admin_id uuid,
  p_reason text default null
) returns table(changed boolean, user_id uuid, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_plan text;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'Unsupported payment action: %', p_action using errcode = '22023';
  end if;

  update public.pro_payments
  set
    status = case when p_action = 'approve' then 'approved' else 'rejected' end,
    reject_reason = case when p_action = 'reject' then p_reason else null end,
    reviewed_by = p_admin_id,
    reviewed_at = now()
  where id = p_payment_id
    and status = 'pending'
  returning pro_payments.user_id, pro_payments.plan
  into v_user_id, v_plan;

  if v_user_id is null then
    return query select false, null::uuid, null::text;
    return;
  end if;

  if p_action = 'approve' then
    perform public.pro_grant_plan(v_user_id, v_plan, 'payment', p_payment_id, p_admin_id);
  end if;

  return query select true, v_user_id, v_plan;
end;
$$;

revoke all on function public.pro_consume(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.pro_refund(uuid, text, text) from public, anon, authenticated;
revoke all on function public.pro_grant_plan(uuid, text, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.pro_review_payment(uuid, text, uuid, text) from public, anon, authenticated;

grant execute on function public.pro_consume(uuid, text, text, integer) to service_role;
grant execute on function public.pro_refund(uuid, text, text) to service_role;
grant execute on function public.pro_grant_plan(uuid, text, text, uuid, uuid) to service_role;
grant execute on function public.pro_review_payment(uuid, text, uuid, text) to service_role;

commit;
