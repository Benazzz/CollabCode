-- CollabCode: public discovery, private team work, and explicit least-privilege grants.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create type public.project_status as enum ('recruiting', 'in_progress', 'completed');
create type public.member_role as enum ('owner', 'maintainer', 'member');
create type public.request_status as enum ('pending', 'accepted', 'rejected');
create type public.task_status as enum ('todo', 'in_progress', 'done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-zA-Z0-9_-]{3,40}$'),
  full_name text not null default '' check (length(full_name) <= 100),
  headline text not null default '' check (length(headline) <= 120),
  bio text not null default '' check (length(bio) <= 2000),
  location text not null default '' check (length(location) <= 100),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  github_username text check (github_username is null or github_username ~ '^[a-zA-Z0-9-]{1,39}$'),
  available boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.technologies (
  id integer generated always as identity primary key,
  name text not null unique, category text not null
);
create table public.profile_technologies (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  technology_id integer not null references public.technologies(id),
  primary key (profile_id, technology_id)
);
create table public.templates (
  id integer generated always as identity primary key,
  slug text not null unique, name text not null, description text not null,
  github_template_repo text check (github_template_repo is null or github_template_repo ~ '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$')
);
create table public.template_tasks (
  id integer generated always as identity primary key,
  template_id integer not null references public.templates(id) on delete cascade,
  title text not null, description text not null default '', position integer not null default 0
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  template_id integer references public.templates(id),
  title text not null check (length(btrim(title)) between 3 and 100),
  summary text not null default '' check (length(summary) <= 180),
  description text not null check (length(btrim(description)) between 20 and 12000),
  status public.project_status not null default 'recruiting',
  category text not null default 'Web app' check (category in ('Web app','Developer tool','Mobile app','Open source','Other')),
  experience_level text not null default 'All levels' check (experience_level in ('All levels','Beginner friendly','Intermediate','Advanced')),
  cover_theme text not null default 'indigo' check (cover_theme in ('indigo','sage','clay','sand')),
  github_repo_name text check (github_repo_name is null or github_repo_name ~ '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'),
  github_repo_url text check (github_repo_url is null or github_repo_url ~ '^https://github[.]com/'),
  tasks_total integer not null default 0 check (tasks_total >= 0),
  tasks_done integer not null default 0 check (tasks_done >= 0 and tasks_done <= tasks_total),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_technologies (
  project_id uuid not null references public.projects(id) on delete cascade,
  technology_id integer not null references public.technologies(id),
  is_required boolean not null default false,
  primary key (project_id, technology_id)
);
create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);
create unique index project_one_owner on public.project_members(project_id) where role = 'owner';
create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (length(btrim(message)) between 10 and 2000),
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(), reviewed_at timestamptz,
  unique (project_id, profile_id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  assignee_id uuid,
  title text not null check (length(btrim(title)) between 3 and 160),
  description text not null default '' check (length(description) <= 6000),
  status public.task_status not null default 'todo',
  position integer not null default 0,
  due_date date,
  template_task_id integer references public.template_tasks(id) on delete set null,
  github_issue_number integer, github_issue_url text check (github_issue_url is null or github_issue_url ~ '^https://github[.]com/'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (project_id, assignee_id) references public.project_members(project_id, profile_id) on delete set null (assignee_id),
  unique (project_id, template_task_id)
);
-- Only the Edge Function service role can use this lease. No provider tokens are stored.
create table public.github_provisioning (
  project_id uuid primary key references public.projects(id) on delete cascade,
  locked_until timestamptz not null default now(),
  lease_id uuid not null,
  completed_at timestamptz
);
create index projects_owner_idx on public.projects(owner_id);
create index projects_template_idx on public.projects(template_id);
create index projects_discovery_idx on public.projects(status, created_at desc);
create index profile_technologies_technology_idx on public.profile_technologies(technology_id, profile_id);
create index project_technologies_technology_idx on public.project_technologies(technology_id, project_id);
create index project_members_profile_idx on public.project_members(profile_id, project_id);
create index join_requests_profile_idx on public.join_requests(profile_id, created_at desc);
create index template_tasks_template_idx on public.template_tasks(template_id);
create index tasks_board_idx on public.tasks(project_id, status, position);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_template_idx on public.tasks(template_task_id);

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function private.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function private.touch_updated_at();

-- Auth hook: editable metadata is used only as display text, never authorization.
create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, username, full_name, avatar_url)
  values (new.id, 'dev_' || replace(new.id::text, '-', ''),
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Developer'),100),
    case when new.raw_user_meta_data->>'avatar_url' ~ '^https://' then new.raw_user_meta_data->>'avatar_url' else null end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.create_profile();

create function private.initialize_project() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or new.owner_id <> auth.uid() then raise exception 'A project requires an authenticated owner'; end if;
  insert into public.project_members(project_id, profile_id, role) values (new.id,new.owner_id,'owner');
  insert into public.tasks(project_id,title,description,position,template_task_id)
    select new.id,title,description,position,id from public.template_tasks where template_id = new.template_id;
  return new;
end $$;
create trigger initialize_project after insert on public.projects for each row execute function private.initialize_project();

create function private.review_join_request() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (select 1 from public.projects where id = new.project_id and owner_id = auth.uid()) then
    raise exception 'Only the project owner can review requests';
  end if;
  if old.status <> 'pending' or new.status not in ('accepted','rejected') then raise exception 'This request has already been reviewed'; end if;
  if new.status = 'accepted' then
    insert into public.project_members(project_id,profile_id,role) values (new.project_id,new.profile_id,'member')
    on conflict (project_id,profile_id) do nothing;
  end if;
  new.reviewed_at = now();
  return new;
end $$;
create trigger review_join_request before update on public.join_requests for each row execute function private.review_join_request();

create function private.update_progress() returns trigger language plpgsql security definer set search_path = '' as $$
declare target_id uuid; total_delta integer := 0; done_delta integer := 0;
begin
  target_id := case when tg_op = 'DELETE' then old.project_id else new.project_id end;
  if tg_op <> 'DELETE' then total_delta := total_delta + 1; done_delta := done_delta + case when new.status = 'done' then 1 else 0 end; end if;
  if tg_op <> 'INSERT' then total_delta := total_delta - 1; done_delta := done_delta - case when old.status = 'done' then 1 else 0 end; end if;
  update public.projects set tasks_total = tasks_total + total_delta, tasks_done = tasks_done + done_delta where id = target_id;
  return null;
end $$;
create trigger task_progress after insert or update of status or delete on public.tasks for each row execute function private.update_progress();

alter table public.profiles enable row level security;
alter table public.technologies enable row level security;
alter table public.profile_technologies enable row level security;
alter table public.templates enable row level security;
alter table public.template_tasks enable row level security;
alter table public.projects enable row level security;
alter table public.project_technologies enable row level security;
alter table public.project_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.tasks enable row level security;
alter table public.github_provisioning enable row level security;

create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy technologies_read on public.technologies for select to anon, authenticated using (true);
create policy profile_technologies_read on public.profile_technologies for select to anon, authenticated using (true);
create policy profile_technologies_insert on public.profile_technologies for insert to authenticated with check (profile_id = (select auth.uid()));
create policy profile_technologies_delete on public.profile_technologies for delete to authenticated using (profile_id = (select auth.uid()));
create policy templates_read on public.templates for select to anon, authenticated using (true);
create policy template_tasks_read on public.template_tasks for select to anon, authenticated using (true);
create policy projects_read on public.projects for select to anon, authenticated using (true);
create policy projects_insert on public.projects for insert to authenticated with check (owner_id = (select auth.uid()));
create policy projects_update on public.projects for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy projects_delete on public.projects for delete to authenticated using (owner_id = (select auth.uid()));
create policy project_technologies_read on public.project_technologies for select to anon, authenticated using (true);
create policy project_technologies_insert on public.project_technologies for insert to authenticated with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy project_technologies_delete on public.project_technologies for delete to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy members_read on public.project_members for select to anon, authenticated using (true);
create policy members_update on public.project_members for update to authenticated using (
  role <> 'owner' and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
) with check (role <> 'owner' and profile_id <> (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy members_delete on public.project_members for delete to authenticated using (
  role <> 'owner' and (profile_id = (select auth.uid()) or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
);
create policy requests_read on public.join_requests for select to authenticated using (
  profile_id = (select auth.uid()) or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
);
create policy requests_insert on public.join_requests for insert to authenticated with check (
  profile_id = (select auth.uid()) and status = 'pending'
  and exists (select 1 from public.projects p where p.id = project_id and p.status = 'recruiting' and p.owner_id <> (select auth.uid()))
  and not exists (select 1 from public.project_members m where m.project_id = join_requests.project_id and m.profile_id = (select auth.uid()))
);
create policy requests_update on public.join_requests for update to authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
) with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy requests_delete on public.join_requests for delete to authenticated using (profile_id = (select auth.uid()) and status in ('pending','rejected'));
create policy tasks_read on public.tasks for select to authenticated using (
  exists (select 1 from public.project_members m where m.project_id = tasks.project_id and m.profile_id = (select auth.uid()))
);
create policy tasks_insert on public.tasks for insert to authenticated with check (
  exists (select 1 from public.project_members m where m.project_id = tasks.project_id and m.profile_id = (select auth.uid()))
);
create policy tasks_update on public.tasks for update to authenticated using (
  exists (select 1 from public.project_members m where m.project_id = tasks.project_id and m.profile_id = (select auth.uid()))
) with check (exists (select 1 from public.project_members m where m.project_id = tasks.project_id and m.profile_id = (select auth.uid())));
create policy tasks_delete on public.tasks for delete to authenticated using (
  exists (select 1 from public.project_members m where m.project_id = tasks.project_id and m.profile_id = (select auth.uid()))
);

-- Revoke default broad privileges before explicitly exposing each operation.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.technologies, public.profile_technologies, public.templates, public.template_tasks,
  public.projects, public.project_technologies, public.project_members to anon, authenticated;
grant update(username,full_name,headline,bio,location,avatar_url,github_username,available) on public.profiles to authenticated;
grant insert,delete on public.profile_technologies to authenticated;
grant insert(owner_id,template_id,title,summary,description,status,category,experience_level,cover_theme) on public.projects to authenticated;
grant update(title,summary,description,status,category,experience_level,cover_theme) on public.projects to authenticated;
grant delete on public.projects to authenticated;
grant insert,delete on public.project_technologies to authenticated;
grant update(role),delete on public.project_members to authenticated;
grant select,delete on public.join_requests to authenticated;
grant insert(project_id,profile_id,message) on public.join_requests to authenticated;
grant update(status) on public.join_requests to authenticated;
grant select,delete on public.tasks to authenticated;
grant insert(project_id,assignee_id,title,description,status,position,due_date) on public.tasks to authenticated;
grant update(assignee_id,title,description,status,position,due_date) on public.tasks to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
revoke execute on all functions in schema private from public, anon, authenticated;

-- Transactional API functions use the caller's RLS and column privileges.
create function public.save_project(
  p_title text, p_summary text, p_description text, p_category text, p_experience_level text,
  p_cover_theme text, p_technology_ids integer[], p_required_ids integer[],
  p_project_id uuid default null, p_template_id integer default null,
  p_status public.project_status default 'recruiting'
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare result_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to save a project'; end if;
  if p_project_id is null then
    insert into public.projects(owner_id,template_id,title,summary,description,category,experience_level,cover_theme,status)
      values (auth.uid(),p_template_id,btrim(p_title),btrim(p_summary),btrim(p_description),p_category,p_experience_level,p_cover_theme,p_status)
      returning id into result_id;
  else
    update public.projects set title=btrim(p_title),summary=btrim(p_summary),description=btrim(p_description),
      category=p_category,experience_level=p_experience_level,cover_theme=p_cover_theme,status=p_status
      where id=p_project_id returning id into result_id;
    if result_id is null then raise exception 'Project not found or permission denied'; end if;
    delete from public.project_technologies where project_id=result_id;
  end if;
  insert into public.project_technologies(project_id,technology_id,is_required)
    select result_id,x,x=any(coalesce(p_required_ids,'{}')) from (
      select distinct unnest(coalesce(p_technology_ids,'{}') || coalesce(p_required_ids,'{}')) x
    ) ids;
  return result_id;
end $$;
revoke execute on function public.save_project from public, anon;
grant execute on function public.save_project to authenticated;

create function public.save_profile(
  p_username text, p_full_name text, p_headline text, p_bio text, p_location text,
  p_github_username text, p_available boolean, p_technology_ids integer[]
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to save your profile'; end if;
  update public.profiles set username=p_username,full_name=p_full_name,headline=p_headline,bio=p_bio,
    location=p_location,github_username=nullif(p_github_username,''),available=p_available where id=auth.uid();
  if not found then raise exception 'Profile not found'; end if;
  delete from public.profile_technologies where profile_id=auth.uid();
  insert into public.profile_technologies(profile_id,technology_id) select auth.uid(), unnest(p_technology_ids);
end $$;
revoke execute on function public.save_profile from public, anon;
grant execute on function public.save_profile to authenticated;

-- Lease acquisition is restricted to the Edge Function service role.
create function public.claim_github_provisioning(p_project_id uuid, p_lease_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.github_provisioning(project_id,lease_id,locked_until)
    values (p_project_id,p_lease_id,now()+interval '5 minutes')
    on conflict(project_id) do update set lease_id=excluded.lease_id,locked_until=excluded.locked_until
      where public.github_provisioning.locked_until < now();
  return found;
end $$;
revoke execute on function public.claim_github_provisioning from public, anon, authenticated;
grant execute on function public.claim_github_provisioning to service_role;

insert into public.technologies(name,category) values
  ('React','Frontend'),('TypeScript','Language'),('JavaScript','Language'),('Next.js','Frontend'),
  ('Vue','Frontend'),('Svelte','Frontend'),('Tailwind CSS','Frontend'),('Node.js','Backend'),
  ('Python','Language'),('C#','Language'),('.NET','Backend'),('Supabase','Backend'),
  ('PostgreSQL','Database'),('Figma','Design'),('UI/UX design','Design'),('React Native','Mobile'),
  ('Docker','DevOps'),('Go','Language');
insert into public.templates(slug,name,description) values
  ('react-ts','React + TypeScript','A focused Vite starter with React, TypeScript, and a clean feature-based structure.'),
  ('react-supabase','React + Supabase','React and TypeScript with a Supabase client, environment example, and auth-ready foundation.'),
  ('dotnet-react','ASP.NET + React','A .NET 10 minimal API alongside a React + TypeScript frontend.');
insert into public.template_tasks(template_id,title,description,position)
select id,'Set up your development environment','Clone the repository, install dependencies, and run the app locally.',0 from public.templates;
insert into public.template_tasks(template_id,title,description,position)
select id,'Define the first milestone','Agree on the problem, audience, and the smallest useful first release.',1 from public.templates;
insert into public.template_tasks(template_id,title,description,position)
select id,'Build the first feature','Choose a small user journey, implement it together, and open a pull request.',2 from public.templates;

alter publication supabase_realtime add table public.tasks, public.project_members, public.join_requests, public.projects;
