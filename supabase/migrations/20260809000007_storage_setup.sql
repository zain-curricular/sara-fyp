-- ============================================================================
-- Storage setup — ShopSmart offline demo images (Phase 4.5)
-- ============================================================================
--
-- Creates the public `listing-images` bucket and a batched URL setter so the
-- image backfill (supabase/scripts/upload-images.mjs) can point listing photos
-- and store logos at locally-hosted Supabase Storage objects instead of the
-- loremflickr CDN — making the whole demo work offline.
--
-- The SQL seed keeps its CDN URLs (so a bare `db reset` still works online);
-- `npm run seed:images` uploads the committed pool (supabase/seed-data/images/)
-- and flips the URLs via the setter below. Re-runnable and idempotent.


-- ---- Public bucket ---------------------------------------------------------
-- Public so `next/image` can read objects at /storage/v1/object/public/...
-- The service-role backfill bypasses RLS for uploads, so no object policies are
-- needed here.

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;


-- ---- Listing image URL setter ----------------------------------------------
-- Batched update so the backfill rewrites ~1100 rows in a handful of round
-- trips. Mirrors the embedding setters (jsonb batch, SECURITY DEFINER).

create or replace function public.set_listing_image_urls(items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	item jsonb;
	updated integer := 0;
begin
	-- Each item: { "id": "<uuid>", "url": "<public url>", "storage_path": "<path>" }
	for item in select * from jsonb_array_elements(items)
	loop
		update public.listing_images
		set url = item->>'url',
			storage_path = item->>'storage_path'
		where id = (item->>'id')::uuid;

		if found then
			updated := updated + 1;
		end if;
	end loop;

	return updated;
end;
$$;

grant execute on function public.set_listing_image_urls(jsonb) to service_role;
