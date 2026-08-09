-- ============================================================================
-- pgvector Search RPCs — ShopSmart ship-ready Phase 0.5
-- ============================================================================
--
-- Four cosine-similarity search functions that the AI/recommendation code
-- already calls but which were never defined (every call returned PGRST202).
-- Argument names/types match the call-sites EXACTLY so PostgREST resolves them:
--
--   search_kb_documents                  <- chatbot retrieveContext
--                                           (src/lib/features/chatbot/services.ts:119)
--   search_listings_by_embedding         <- chatbot retrieveContext
--                                           (src/lib/features/chatbot/services.ts:123)
--   find_similar_listings                <- src/app/api/recommendations/similar/route.ts:51
--   find_similar_listings_multi_category <- src/app/api/recommendations/for-you/route.ts:62
--
-- All are SECURITY INVOKER (default), STABLE, and return an EMPTY set when the
-- query embedding is NULL — so the no-embedding case (before the P3.3 backfill)
-- degrades to the callers' SQL fallbacks instead of erroring. pgvector lives in
-- the public schema, so search_path = public resolves both the vector type and
-- the `<=>` cosine-distance operator (and pins it for the advisor).
--
-- Return shapes are a scalar superset of what each caller maps; listing image
-- rows are joined by the callers/UI (P3.5), not here.


-- ---- KB documents ----------------------------------------------------------

create or replace function public.search_kb_documents(
	query_embedding vector(1536),
	match_count int default 3
)
returns table (
	id uuid,
	title text,
	content text,
	similarity float
)
language sql
stable
set search_path = public
as $$
	select
		d.id,
		d.title,
		d.content,
		1 - (d.embedding <=> query_embedding) as similarity
	from public.kb_documents d
	where query_embedding is not null
		and d.embedding is not null
	order by d.embedding <=> query_embedding
	limit greatest(coalesce(match_count, 3), 0);
$$;


-- ---- Listings by embedding (chatbot context) -------------------------------

create or replace function public.search_listings_by_embedding(
	query_embedding vector(1536),
	match_count int default 3
)
returns table (
	id uuid,
	title text,
	price numeric,
	city text,
	condition text,
	similarity float
)
language sql
stable
set search_path = public
as $$
	select
		l.id,
		l.title,
		l.price,
		l.city,
		l.condition::text,
		1 - (l.embedding <=> query_embedding) as similarity
	from public.listings l
	where query_embedding is not null
		and l.embedding is not null
		and l.status = 'active'
	order by l.embedding <=> query_embedding
	limit greatest(coalesce(match_count, 3), 0);
$$;


-- ---- Similar listings (single category) ------------------------------------

create or replace function public.find_similar_listings(
	query_embedding vector(1536),
	exclude_id uuid,
	target_category_id uuid,
	match_count int default 6
)
returns table (
	id uuid,
	title text,
	price numeric,
	city text,
	condition text,
	category_id uuid,
	similarity float
)
language sql
stable
set search_path = public
as $$
	select
		l.id,
		l.title,
		l.price,
		l.city,
		l.condition::text,
		l.category_id,
		1 - (l.embedding <=> query_embedding) as similarity
	from public.listings l
	where query_embedding is not null
		and l.embedding is not null
		and l.status = 'active'
		and l.id <> exclude_id
		and (target_category_id is null or l.category_id = target_category_id)
	order by l.embedding <=> query_embedding
	limit greatest(coalesce(match_count, 6), 0);
$$;


-- ---- Similar listings (multi category, for-you) ----------------------------

create or replace function public.find_similar_listings_multi_category(
	query_embedding vector(1536),
	category_ids uuid[],
	exclude_ids uuid[],
	match_count int default 8
)
returns table (
	id uuid,
	title text,
	price numeric,
	city text,
	condition text,
	category_id uuid,
	similarity float
)
language sql
stable
set search_path = public
as $$
	select
		l.id,
		l.title,
		l.price,
		l.city,
		l.condition::text,
		l.category_id,
		1 - (l.embedding <=> query_embedding) as similarity
	from public.listings l
	where query_embedding is not null
		and l.embedding is not null
		and l.status = 'active'
		and l.id <> all (coalesce(exclude_ids, '{}'::uuid[]))
		and (
			coalesce(array_length(category_ids, 1), 0) = 0
			or l.category_id = any (category_ids)
		)
	order by l.embedding <=> query_embedding
	limit greatest(coalesce(match_count, 8), 0);
$$;


-- ---- Grants ----------------------------------------------------------------
-- similar/for-you routes and the chatbot are reachable by both anon and
-- authenticated users; functions only SELECT, so INVOKER + these grants suffice.

grant execute on function public.search_kb_documents(vector, int) to anon, authenticated;
grant execute on function public.search_listings_by_embedding(vector, int) to anon, authenticated;
grant execute on function public.find_similar_listings(vector, uuid, uuid, int) to anon, authenticated;
grant execute on function public.find_similar_listings_multi_category(vector, uuid[], uuid[], int) to anon, authenticated;
