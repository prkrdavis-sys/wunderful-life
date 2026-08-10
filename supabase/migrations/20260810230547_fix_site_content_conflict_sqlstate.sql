-- PostgREST retries SQLSTATE 40001 (serialization_failure) automatically.
-- Stale admin saves raised SITE_CONTENT_VERSION_CONFLICT with that code, so
-- the request hung until the API gateway returned 504. Use P0001 instead.
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

revoke all on function public.save_site_content(bigint, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.save_site_content(bigint, jsonb, text) to service_role;
