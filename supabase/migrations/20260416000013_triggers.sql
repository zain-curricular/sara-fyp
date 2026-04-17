-- ============================================================================
-- Triggers
-- ============================================================================
--
-- Automated side effects: search vector updates, unread counters, aggregate
-- ratings, warranty creation, updated_at timestamps, and browsing history caps.
--


-- -------------------------------------------------------
-- Generic updated_at trigger function
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;


-- Apply updated_at to all relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON listings
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON auction_config
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON auto_bids
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON test_reports
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON warranties
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON warranty_claims
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON spare_parts_orders
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON brands
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON models
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON specifications
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON repair_centers
	FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- -------------------------------------------------------
-- Listing: search vector maintenance
-- -------------------------------------------------------

CREATE TRIGGER update_listing_search
	BEFORE INSERT OR UPDATE OF title, description, city, details ON listings
	FOR EACH ROW
	EXECUTE FUNCTION update_listing_search_vector();


-- -------------------------------------------------------
-- Listing: subscription limit enforcement
-- -------------------------------------------------------

CREATE TRIGGER enforce_listing_limit
	BEFORE INSERT ON listings
	FOR EACH ROW
	WHEN (NEW.status IN ('active', 'pending_review'))
	EXECUTE FUNCTION check_listing_limit();


-- -------------------------------------------------------
-- Messages: update conversation metadata on new message
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	v_conv record;
BEGIN

	SELECT buyer_id, seller_id
	INTO v_conv
	FROM public.conversations
	WHERE id = NEW.conversation_id;

	-- Update conversation last_message and unread counters
	UPDATE public.conversations
	SET last_message_at = NEW.created_at,
		last_message_preview = left(NEW.content, 100),
		unread_count_buyer = CASE
			WHEN NEW.sender_id = v_conv.buyer_id THEN unread_count_buyer
			ELSE unread_count_buyer + 1
		END,
		unread_count_seller = CASE
			WHEN NEW.sender_id = v_conv.seller_id THEN unread_count_seller
			ELSE unread_count_seller + 1
		END
	WHERE id = NEW.conversation_id;

	-- Create notification for recipient
	INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
	VALUES (
		CASE
			WHEN NEW.sender_id = v_conv.buyer_id THEN v_conv.seller_id
			ELSE v_conv.buyer_id
		END,
		'new_message',
		'New message',
		left(NEW.content, 100),
		'conversation',
		NEW.conversation_id
	);

	RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
	AFTER INSERT ON messages
	FOR EACH ROW
	EXECUTE FUNCTION handle_new_message();


-- -------------------------------------------------------
-- Reviews: update profile aggregate rating
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

	UPDATE public.profiles
	SET avg_rating = (
			SELECT ROUND(AVG(rating)::numeric, 2)
			FROM public.reviews
			WHERE reviewed_user_id = NEW.reviewed_user_id
		),
		total_reviews = (
			SELECT count(*)
			FROM public.reviews
			WHERE reviewed_user_id = NEW.reviewed_user_id
		)
	WHERE id = NEW.reviewed_user_id;

	-- Notify the reviewed user
	INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
	VALUES (
		NEW.reviewed_user_id,
		'review_received',
		'New review received',
		'You received a ' || NEW.rating || '-star review',
		'review',
		NEW.id
	);

	RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_review
	AFTER INSERT ON reviews
	FOR EACH ROW
	EXECUTE FUNCTION handle_new_review();


-- -------------------------------------------------------
-- Orders: create warranty on completion
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_order_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

	-- Only fire when transitioning TO 'completed'
	IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

		INSERT INTO public.warranties (order_id, listing_id, buyer_id, seller_id, starts_at, expires_at)
		VALUES (
			NEW.id,
			NEW.listing_id,
			NEW.buyer_id,
			NEW.seller_id,
			now(),
			now() + interval '6 months'
		);

		-- Update seller stats
		UPDATE public.profiles
		SET total_sales = total_sales + 1
		WHERE id = NEW.seller_id;
	END IF;

	RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_completed
	AFTER UPDATE ON orders
	FOR EACH ROW
	WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
	EXECUTE FUNCTION handle_order_completed();


-- -------------------------------------------------------
-- Listings: update profile listing count
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_listing_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

	IF TG_OP = 'INSERT' THEN
		UPDATE public.profiles
		SET total_listings = total_listings + 1
		WHERE id = NEW.user_id;
		RETURN NEW;
	END IF;

	IF TG_OP = 'UPDATE' THEN
		-- Only count active listings
		IF NEW.status = 'active' AND OLD.status != 'active' THEN
			UPDATE public.profiles
			SET total_listings = total_listings + 1
			WHERE id = NEW.user_id;
		ELSIF NEW.status != 'active' AND OLD.status = 'active' THEN
			UPDATE public.profiles
			SET total_listings = GREATEST(total_listings - 1, 0)
			WHERE id = NEW.user_id;
		END IF;
		RETURN NEW;
	END IF;

	RETURN NULL;
END;
$$;

CREATE TRIGGER on_listing_count_change
	AFTER INSERT OR UPDATE OF status ON listings
	FOR EACH ROW
	EXECUTE FUNCTION handle_listing_count_change();


-- -------------------------------------------------------
-- Viewed listings: cap history per user (max 500)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION cap_viewed_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

	DELETE FROM public.viewed_listings
	WHERE id IN (
		SELECT id FROM public.viewed_listings
		WHERE user_id = NEW.user_id
		ORDER BY viewed_at DESC
		OFFSET 500
	);

	RETURN NEW;
END;
$$;

CREATE TRIGGER on_viewed_listing_insert
	AFTER INSERT ON viewed_listings
	FOR EACH ROW
	EXECUTE FUNCTION cap_viewed_listings();


-- -------------------------------------------------------
-- Reports: auto-flag listing if report threshold reached
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	v_count integer;
BEGIN

	IF NEW.target_type = 'listing' THEN
		SELECT count(*) INTO v_count
		FROM public.reports
		WHERE target_type = 'listing'
			AND target_id = NEW.target_id
			AND status = 'pending';

		IF v_count >= 5 THEN
			UPDATE public.listings
			SET status = 'flagged', updated_at = now()
			WHERE id = NEW.target_id AND status = 'active';
		END IF;
	END IF;

	RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_report
	AFTER INSERT ON reports
	FOR EACH ROW
	EXECUTE FUNCTION check_report_threshold();
