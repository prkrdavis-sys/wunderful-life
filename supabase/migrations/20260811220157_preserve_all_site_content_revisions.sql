-- Keep a recoverable snapshot for every site_content write, including direct
-- administrative SQL. Previously only writes through save_site_content were
-- archived, so an emergency UPDATE could bypass revision history.
create or replace function public.validate_site_content_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.version <> old.version + 1 then
    raise exception 'SITE_CONTENT_VERSION_MUST_INCREMENT'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.archive_site_content_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_content_revisions (
    site_id,
    version,
    content,
    updated_by
  )
  values (
    new.id,
    new.version,
    new.content,
    new.updated_by
  );

  return new;
end;
$$;

drop trigger if exists validate_site_content_version on public.site_content;
create trigger validate_site_content_version
before update of content, version on public.site_content
for each row
when (
  old.content is distinct from new.content
  or old.version is distinct from new.version
)
execute function public.validate_site_content_version();

drop trigger if exists archive_site_content_insert on public.site_content;
create trigger archive_site_content_insert
after insert on public.site_content
for each row
execute function public.archive_site_content_revision();

drop trigger if exists archive_site_content_update on public.site_content;
create trigger archive_site_content_update
after update of content, version on public.site_content
for each row
when (
  old.content is distinct from new.content
  or old.version is distinct from new.version
)
execute function public.archive_site_content_revision();

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
begin
  insert into public.site_content (id, content, version, updated_by)
  values ('singleton', initial_content, 1, actor)
  on conflict (id) do nothing
  returning * into result;

  if result.id is null then
    select * into result from public.site_content where id = 'singleton';
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
    raise exception 'SITE_CONTENT_VERSION_CONFLICT'
      using errcode = 'P0001';
  end if;

  return result;
end;
$$;

revoke all on function public.validate_site_content_version() from public;
revoke all on function public.archive_site_content_revision() from public;
revoke all on function public.initialize_site_content(jsonb, text)
  from public, anon, authenticated;
revoke all on function public.save_site_content(bigint, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.initialize_site_content(jsonb, text) to service_role;
grant execute on function public.save_site_content(bigint, jsonb, text) to service_role;
