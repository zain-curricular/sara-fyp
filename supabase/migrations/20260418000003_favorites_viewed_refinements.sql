-- ============================================================================
-- Favorites & viewed listings refinements
-- ============================================================================
--
-- 1) UNIQUE (user_id, listing_id) on viewed_listings — enables upsert semantics.
-- 2) listings.favorite_count — denormalized count maintained by trigger on favorites.

-- -------------------------------------------------------
-- Dedupe viewed_listings before unique constraint
-- -------------------------------------------------------

DELETE FROM public.viewed_listings vl
WHERE vl.id IN (
	SELECT id
	FROM (
		SELECT
			id,
			row_number() OVER (
				PARTITION BY user_id, listing_id
				ORDER BY viewed_at DESC
			) AS rn
		FROM public.viewed_listings
	) t
	WHERE t.rn > 1
);

ALTER TABLE public.viewed_listings
	ADD CONSTRAINT viewed_listings_user_listing_uq UNIQUE (user_id, listing_id);

-- -------------------------------------------------------
-- Denormalized favorite_count on listings
-- -------------------------------------------------------

ALTER TABLE public.listings
	ADD COLUMN IF NOT EXISTS favorite_count integer NOT NULL DEFAULT 0
	CHECK (favorite_count >= 0);

UPDATE public.listings l
SET favorite_count = (
	SELECT count(*)::integer
	FROM public.favorites f
	WHERE f.listing_id = l.id
);

CREATE OR REPLACE FUNCTION public.handle_favorite_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
	IF TG_OP = 'INSERT' THEN
		UPDATE public.listings
		SET favorite_count = favorite_count + 1
		WHERE id = NEW.listing_id;
	ELSIF TG_OP = 'DELETE' THEN
		UPDATE public.listings
		SET favorite_count = greatest(favorite_count - 1, 0)
		WHERE id = OLD.listing_id;
	END IF;
	RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS favorites_count_change ON public.favorites;

CREATE TRIGGER favorites_count_change
	AFTER INSERT OR DELETE ON public.favorites
	FOR EACH ROW
	EXECUTE FUNCTION public.handle_favorite_change();

COMMENT ON COLUMN public.listings.favorite_count IS 'Denormalized count of favorites rows; maintained by favorites_count_change trigger.';
