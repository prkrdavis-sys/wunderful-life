create table public.site_content (
  id text primary key check (id = 'singleton'),
  content jsonb not null,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by text
);

create table public.site_content_revisions (
  id bigint generated always as identity primary key,
  site_id text not null references public.site_content(id) on delete cascade,
  version bigint not null,
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_by text,
  unique (site_id, version)
);

alter table public.site_content enable row level security;
alter table public.site_content_revisions enable row level security;

create or replace function public.initialize_site_content(
  initial_content jsonb,
  actor text default null
)
returns public.site_content
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.site_content;
  inserted boolean := false;
begin
  insert into public.site_content (id, content, version, updated_by)
  values ('singleton', initial_content, 1, actor)
  on conflict (id) do nothing
  returning * into result;

  if result.id is not null then
    inserted := true;
  else
    select * into result from public.site_content where id = 'singleton';
  end if;

  if inserted then
    insert into public.site_content_revisions (site_id, version, content, updated_by)
    values ('singleton', result.version, result.content, result.updated_by);
  end if;

  return result;
end;
$$;

create or replace function public.save_site_content(
  expected_version bigint,
  next_content jsonb,
  actor text default null
)
returns public.site_content
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.site_content;
begin
  update public.site_content
  set content = next_content,
      version = version + 1,
      updated_at = timezone('utc', now()),
      updated_by = actor
  where id = 'singleton' and version = expected_version
  returning * into result;

  if not found then
    -- Use P0001 (not 40001 serialization_failure). PostgREST retries 40001
    -- until the statement times out, which made stale saves hang for ~60s.
    raise exception 'SITE_CONTENT_VERSION_CONFLICT'
      using errcode = 'P0001';
  end if;

  insert into public.site_content_revisions (
    site_id,
    version,
    content,
    updated_by
  )
  values (
    'singleton',
    result.version,
    result.content,
    result.updated_by
  );

  return result;
end;
$$;

revoke all on table public.site_content from anon, authenticated;
revoke all on table public.site_content_revisions from anon, authenticated;
revoke all on function public.initialize_site_content(jsonb, text)
  from public, anon, authenticated;
revoke all on function public.save_site_content(bigint, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.initialize_site_content(jsonb, text) to service_role;
grant execute on function public.save_site_content(bigint, jsonb, text) to service_role;
