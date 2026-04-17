-- ============================================================================
-- Listing subscription limit — enforce on status transition (draft → active)
-- ============================================================================
--
-- Previously `check_listing_limit` ran only on INSERT. Publishing a draft uses
-- UPDATE … SET status = 'active', which bypassed the trigger. This migration
-- replaces the function and trigger so the same quota logic runs when a row
-- first enters `active` or `pending_review` from any other status.

CREATE OR REPLACE FUNCTION check_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	v_max_listings integer;
	v_current_count integer;
BEGIN
	-- INSERT: only when creating already-active rows (rare; most drafts insert as draft)
	IF TG_OP = 'INSERT' THEN
		IF NEW.status NOT IN ('active', 'pending_review') THEN
			RETURN NEW;
		END IF;
	ELSIF TG_OP = 'UPDATE' THEN
		-- UPDATE: only when transitioning *into* active/pending_review from elsewhere
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

	SELECT COALESCE(s.max_active_listings, 5)
	INTO v_max_listings
	FROM subscriptions s
	WHERE s.user_id = NEW.user_id AND s.is_active = true
	ORDER BY s.created_at DESC
	LIMIT 1;

	IF v_max_listings IS NULL THEN
		v_max_listings := 5;
	END IF;

	SELECT count(*)
	INTO v_current_count
	FROM listings
	WHERE user_id = NEW.user_id
		AND status IN ('active', 'pending_review')
		AND deleted_at IS NULL;

	IF v_current_count >= v_max_listings THEN
		RAISE EXCEPTION 'Listing limit reached. You can have % active listings on your current plan.', v_max_listings;
	END IF;

	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_limit ON listings;

CREATE TRIGGER enforce_listing_limit
	BEFORE INSERT OR UPDATE OF status ON listings
	FOR EACH ROW
	EXECUTE FUNCTION check_listing_limit();
