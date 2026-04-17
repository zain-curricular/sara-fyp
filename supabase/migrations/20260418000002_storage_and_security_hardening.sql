-- ============================================================================
-- Storage + Security Hardening
-- ============================================================================
--
-- Applies two review fixes:
--
-- 1. Add missing UPDATE policy on the `listing-images` storage bucket so owner
--    code paths that overwrite (upsert) files succeed under RLS. Select, insert
--    and delete policies already exist; only update was absent.
--
-- 2. Re-create `check_listing_limit` with `SECURITY DEFINER` and
--    `SET search_path = ''` for consistency with every other trigger function
--    in this schema. The function queries `public.subscriptions` and
--    `public.listings`; qualifying the table names removes any reliance on the
--    caller's search_path.
--


-- -------------------------------------------------------
-- 1. Missing storage UPDATE policy — listing-images
-- -------------------------------------------------------

CREATE POLICY listing_images_update ON storage.objects
	FOR UPDATE USING (
		bucket_id = 'listing-images'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);


-- -------------------------------------------------------
-- 2. Harden check_listing_limit
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION check_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	v_max_listings integer;
	v_current_count integer;
BEGIN

	-- Gate on the actual status change: only enforce when the row is entering
	-- an "active-ish" state. Existing entries and status changes that stay
	-- within the non-active set are unaffected.
	IF TG_OP = 'INSERT' THEN
		IF NEW.status NOT IN ('active', 'pending_review') THEN
			RETURN NEW;
		END IF;
	ELSIF TG_OP = 'UPDATE' THEN
		IF NOT (
			NEW.status IN ('active', 'pending_review')
			AND OLD.status IS DISTINCT FROM NEW.status
			AND OLD.status NOT IN ('active', 'pending_review')
		) THEN
			RETURN NEW;
		END IF;
	ELSE
		RETURN NEW;
	END IF;

	-- Current plan cap (defaults to 5 when no active subscription exists)
	SELECT COALESCE(s.max_active_listings, 5)
	INTO v_max_listings
	FROM public.subscriptions s
	WHERE s.user_id = NEW.user_id AND s.is_active = true
	ORDER BY s.created_at DESC
	LIMIT 1;

	IF v_max_listings IS NULL THEN
		v_max_listings := 5;
	END IF;

	-- Currently consumed slots
	SELECT count(*)
	INTO v_current_count
	FROM public.listings
	WHERE user_id = NEW.user_id
		AND status IN ('active', 'pending_review')
		AND deleted_at IS NULL;

	IF v_current_count >= v_max_listings THEN
		RAISE EXCEPTION 'Listing limit reached. You can have % active listings on your current plan.', v_max_listings;
	END IF;

	RETURN NEW;
END;
$$;
