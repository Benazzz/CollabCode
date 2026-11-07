-- Use the GitHub username and name when a profile is created.
create or replace function private.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  github_login text := meta->>'user_name';
  base_username text := regexp_replace(coalesce(github_login, split_part(new.email, '@', 1), ''), '[^a-zA-Z0-9_-]', '', 'g');  
  final_username text;
begin
  if length(base_username) between 3 and 40
     and not exists (select 1 from public.profiles where username = base_username) then
    final_username := base_username;
  else
    final_username := 'dev_' || replace(new.id::text, '-', '');
  end if;

  insert into public.profiles (id, username, full_name, avatar_url, github_username)
  values (
    new.id,
    final_username,
    left(coalesce(nullif(meta->>'full_name', ''), nullif(meta->>'name', ''), nullif(github_login, ''), 'Developer'), 100),
    case when meta->>'avatar_url' ~ '^https://' then meta->>'avatar_url' end,
    case when github_login ~ '^[a-zA-Z0-9-]{1,39}$' then github_login end
  );
  return new;
end $$;