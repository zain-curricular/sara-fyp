-- Hand the auth + storage schemas to their service admin roles.
--
-- The base `supabase/postgres` image bakes the full auth and storage schemas,
-- owned by supabase_admin/postgres. But GoTrue and Storage each run their own
-- migrations at startup as supabase_auth_admin / supabase_storage_admin and must
-- OWN those objects — otherwise GoTrue fails with "must be owner of function uid"
-- and never creates a healthy auth service. Reassign ownership here, during db
-- init (before any service connects), so a clean `up` needs no manual patching.
--
-- Runs after the image's own auth/storage schema scripts (this file sorts last).

-- Realtime runs its Ecto migrations under `search_path = _realtime` and connects
-- as supabase_admin. The upstream self-hosting `realtime.sql` init (which we don't
-- mount) normally creates this schema; without it realtime crash-loops with
-- "no schema has been selected to create in". Create + grant it here.
create schema if not exists _realtime;
grant all on schema _realtime to supabase_admin;
grant usage on schema _realtime to postgres, anon, authenticated, service_role;

-- Let Storage assume the request's JWT role. storage-api connects as
-- supabase_storage_admin and does `SET ROLE <jwt role>` per request; to reach
-- service_role (which has BYPASSRLS, needed to seed images), it must be able to
-- become it. The CLI grants this via authenticator (→ anon/authenticated/
-- service_role); the plain base image does not. Without it, uploads fail with
-- "new row violates row-level security policy".
do $$
begin
	if exists (select 1 from pg_roles where rolname = 'authenticator')
		and exists (select 1 from pg_roles where rolname = 'supabase_storage_admin') then
		execute 'grant authenticator to supabase_storage_admin';
	end if;
end $$;

do $$
declare
	r record;
begin
	if exists (select 1 from pg_namespace where nspname = 'auth') then
		execute 'alter schema auth owner to supabase_auth_admin';
		for r in select format('alter table auth.%I owner to supabase_auth_admin', tablename) c
			from pg_tables where schemaname = 'auth' loop execute r.c; end loop;
		for r in select format('alter sequence auth.%I owner to supabase_auth_admin', sequencename) c
			from pg_sequences where schemaname = 'auth' loop execute r.c; end loop;
		for r in select format('alter function auth.%I(%s) owner to supabase_auth_admin',
			p.proname, pg_get_function_identity_arguments(p.oid)) c
			from pg_proc p join pg_namespace n on n.oid = p.pronamespace
			where n.nspname = 'auth' loop execute r.c; end loop;
	end if;

	if exists (select 1 from pg_namespace where nspname = 'storage') then
		execute 'alter schema storage owner to supabase_storage_admin';
		for r in select format('alter table storage.%I owner to supabase_storage_admin', tablename) c
			from pg_tables where schemaname = 'storage' loop execute r.c; end loop;
		for r in select format('alter sequence storage.%I owner to supabase_storage_admin', sequencename) c
			from pg_sequences where schemaname = 'storage' loop execute r.c; end loop;
		for r in select format('alter function storage.%I(%s) owner to supabase_storage_admin',
			p.proname, pg_get_function_identity_arguments(p.oid)) c
			from pg_proc p join pg_namespace n on n.oid = p.pronamespace
			where n.nspname = 'storage' loop execute r.c; end loop;
	end if;
end $$;
