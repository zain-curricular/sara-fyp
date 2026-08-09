-- ============================================================================
-- Embedding setter RPCs — ShopSmart ship-ready Phase 3.3 (backfill support)
-- ============================================================================
--
-- The vector search RPCs (20260809000002) read `listings.embedding` /
-- `kb_documents.embedding`, but nothing WRITES those columns — the demo seed is
-- pure SQL and cannot call OpenAI. These two setters let an out-of-band Node
-- backfill (supabase/scripts/backfill-embeddings.mjs) push embeddings computed
-- from the live OpenAI provider back into Postgres in batches.
--
-- Why a jsonb batch of NUMBERS (not a pgvector text literal):
--   * one round-trip per ~100 rows instead of per row;
--   * numeric arrays avoid float round-tripping through string formatting;
--   * `float8[]::vector` is a first-class pgvector cast (verified), and
--     `WITH ORDINALITY ... ORDER BY ord` pins element order so dimension i of
--     the JSON array maps to dimension i of the stored vector.
--
-- SECURITY DEFINER + `set search_path = public` so the caller only needs
-- execute on the function; the vector type/cast live in public. Re-runnable:
-- `create or replace`, and the backfill only targets rows where embedding IS
-- NULL, so it is safe to run after every `supabase db reset`.


-- ---- Listings --------------------------------------------------------------

create or replace function public.set_listing_embeddings(items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	item jsonb;
	updated integer := 0;
begin
	-- Each item: { "id": "<uuid>", "values": [f0, f1, ... f1535] }
	for item in select * from jsonb_array_elements(items)
	loop
		update public.listings
		set embedding = (
			select array_agg(val::float8 order by ord)
			from jsonb_array_elements_text(item->'values') with ordinality as t(val, ord)
		)::vector
		where id = (item->>'id')::uuid;

		if found then
			updated := updated + 1;
		end if;
	end loop;

	return updated;
end;
$$;


-- ---- KB documents ----------------------------------------------------------

create or replace function public.set_kb_embeddings(items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	item jsonb;
	updated integer := 0;
begin
	for item in select * from jsonb_array_elements(items)
	loop
		update public.kb_documents
		set embedding = (
			select array_agg(val::float8 order by ord)
			from jsonb_array_elements_text(item->'values') with ordinality as t(val, ord)
		)::vector
		where id = (item->>'id')::uuid;

		if found then
			updated := updated + 1;
		end if;
	end loop;

	return updated;
end;
$$;


-- ---- Grants ----------------------------------------------------------------
-- Only the service-role backfill invokes these (they mutate + run as definer);
-- keep them off anon/authenticated.

grant execute on function public.set_listing_embeddings(jsonb) to service_role;
grant execute on function public.set_kb_embeddings(jsonb) to service_role;
