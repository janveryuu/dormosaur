-- Trigger/helper functions must not be callable via /rest/v1/rpc.
revoke execute on function public.protect_profile_admin_column() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
