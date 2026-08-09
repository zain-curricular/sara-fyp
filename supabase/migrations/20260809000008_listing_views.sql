-- ============================================================================
-- listing_views — recently-viewed tracking (recommendations input)
-- ============================================================================
--
-- The "For You" recommendations route and the buyer "Recently viewed" page read
-- `public.listing_views`, and the listing detail page records a view via
-- POST /api/listings/[id]/view — but the table was never created (every read
-- errored / every write 404'd). Create it here.
--
-- One row per (user, listing); re-viewing bumps `viewed_at` (upsert on the
-- unique pair). RLS: a user sees and writes only their own views.

create table if not exists public.listing_views (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	listing_id uuid not null references public.listings (id) on delete cascade,
	viewed_at timestamptz not null default now(),
	unique (user_id, listing_id)
);

create index if not exists listing_views_user_viewed_idx
	on public.listing_views (user_id, viewed_at desc);

alter table public.listing_views enable row level security;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'public' and tablename = 'listing_views'
			and policyname = 'listing_views_own'
	) then
		create policy listing_views_own on public.listing_views
			for all
			using (auth.uid() = user_id)
			with check (auth.uid() = user_id);
	end if;
end $$;
