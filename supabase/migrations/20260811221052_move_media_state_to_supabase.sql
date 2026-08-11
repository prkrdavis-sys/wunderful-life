insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-media',
  'site-media',
  true,
  52428800,
  array['image/*', 'video/*']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table public.portfolio_library (
  id text primary key check (id = 'singleton'),
  videos jsonb not null default '[]'::jsonb
    check (jsonb_typeof(videos) = 'array'),
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by text
);

create table public.portfolio_library_revisions (
  id bigint generated always as identity primary key,
  library_id text not null references public.portfolio_library(id)
    on delete cascade,
  version bigint not null,
  videos jsonb not null check (jsonb_typeof(videos) = 'array'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by text,
  unique (library_id, version)
);

alter table public.portfolio_library enable row level security;
alter table public.portfolio_library_revisions enable row level security;

create or replace function public.archive_portfolio_library_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.portfolio_library_revisions (
    library_id,
    version,
    videos,
    updated_by
  )
  values (
    new.id,
    new.version,
    new.videos,
    new.updated_by
  );

  return new;
end;
$$;

create trigger archive_portfolio_library_insert
after insert on public.portfolio_library
for each row
execute function public.archive_portfolio_library_revision();

create trigger archive_portfolio_library_update
after update of videos, version on public.portfolio_library
for each row
when (
  old.videos is distinct from new.videos
  or old.version is distinct from new.version
)
execute function public.archive_portfolio_library_revision();

create or replace function public.initialize_portfolio_library(
  initial_videos jsonb,
  actor text default null
)
returns public.portfolio_library
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.portfolio_library;
begin
  if jsonb_typeof(initial_videos) <> 'array' then
    raise exception 'PORTFOLIO_LIBRARY_MUST_BE_ARRAY'
      using errcode = 'P0001';
  end if;

  insert into public.portfolio_library (id, videos, version, updated_by)
  values ('singleton', initial_videos, 1, actor)
  on conflict (id) do nothing
  returning * into result;

  if result.id is null then
    select * into result
    from public.portfolio_library
    where id = 'singleton';
  end if;

  return result;
end;
$$;

create or replace function public.save_portfolio_library(
  expected_version bigint,
  next_videos jsonb,
  actor text default null
)
returns public.portfolio_library
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.portfolio_library;
begin
  if jsonb_typeof(next_videos) <> 'array' then
    raise exception 'PORTFOLIO_LIBRARY_MUST_BE_ARRAY'
      using errcode = 'P0001';
  end if;

  update public.portfolio_library
  set videos = next_videos,
      version = version + 1,
      updated_at = timezone('utc', now()),
      updated_by = actor
  where id = 'singleton' and version = expected_version
  returning * into result;

  if not found then
    raise exception 'PORTFOLIO_LIBRARY_VERSION_CONFLICT'
      using errcode = 'P0001';
  end if;

  return result;
end;
$$;

revoke all on table public.portfolio_library from anon, authenticated;
revoke all on table public.portfolio_library_revisions from anon, authenticated;
revoke all on function public.archive_portfolio_library_revision()
  from public, anon, authenticated;
revoke all on function public.initialize_portfolio_library(jsonb, text)
  from public, anon, authenticated;
revoke all on function public.save_portfolio_library(bigint, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.initialize_portfolio_library(jsonb, text)
  to service_role;
grant execute on function public.save_portfolio_library(bigint, jsonb, text)
  to service_role;
