-- The platform's event trigger is internal, not a public RPC.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
create index tasks_project_assignee_idx on public.tasks(project_id,assignee_id);
create policy provisioning_service_only on public.github_provisioning for all to service_role using (true) with check (true);
-- A former member may clear an old accepted request before introducing themselves again.
alter policy requests_delete on public.join_requests using (
  profile_id = (select auth.uid()) and
  (status in ('pending','rejected') or not exists (
    select 1 from public.project_members m where m.project_id = join_requests.project_id and m.profile_id = (select auth.uid())
  ))
);
