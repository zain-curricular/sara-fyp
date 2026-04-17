-- ============================================================================
-- Database Functions
-- ============================================================================
--
-- Core business operations that must be atomic. Called via Supabase RPC.
-- These run as SECURITY INVOKER so RLS still applies to the calling user.
--
-- Functions here:
--   1. place_bid         — atomic bid placement with anti-snipe + auto-bid
--   2. transition_order  — state machine for order status
--   3. create_buy_now_order — instant purchase flow
--   4. mark_messages_read — batch-mark messages as read
--   5. update_search_vector — full-text search maintenance
--   6. check_listing_limit — subscription enforcement
--


-- -------------------------------------------------------
-- 1. Place Bid (atomic auction bid)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION place_bid(
	p_listing_id uuid,
	p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
	v_auction auction_config%ROWTYPE;
	v_listing listings%ROWTYPE;
	v_min_bid numeric;
	v_bidder_id uuid := auth.uid();
	v_prev_bidder_id uuid;
	v_new_bid_id uuid;
	v_auto auto_bids%ROWTYPE;
	v_counter_amount numeric;
BEGIN

	-- Lock the listing row to prevent race conditions
	SELECT * INTO v_listing FROM listings WHERE id = p_listing_id FOR UPDATE;

	IF v_listing IS NULL THEN
		RETURN jsonb_build_object('error', 'Listing not found');
	END IF;

	IF v_listing.status != 'active' THEN
		RETURN jsonb_build_object('error', 'Listing is not active');
	END IF;

	IF v_listing.sale_type NOT IN ('auction', 'both') THEN
		RETURN jsonb_build_object('error', 'Listing does not accept bids');
	END IF;

	IF v_listing.user_id = v_bidder_id THEN
		RETURN jsonb_build_object('error', 'Cannot bid on your own listing');
	END IF;

	-- Get auction config
	SELECT * INTO v_auction FROM auction_config WHERE listing_id = p_listing_id;

	IF v_auction IS NULL THEN
		RETURN jsonb_build_object('error', 'Auction config not found');
	END IF;

	IF now() > v_auction.auction_end_at THEN
		RETURN jsonb_build_object('error', 'Auction has ended');
	END IF;

	IF now() < v_auction.auction_start_at THEN
		RETURN jsonb_build_object('error', 'Auction has not started');
	END IF;

	-- Calculate minimum valid bid
	IF v_listing.current_bid IS NOT NULL THEN
		v_min_bid := v_listing.current_bid + v_auction.min_increment;
	ELSE
		v_min_bid := v_auction.starting_price;
	END IF;

	IF p_amount < v_min_bid THEN
		RETURN jsonb_build_object(
			'error', 'Bid too low',
			'minimum_bid', v_min_bid
		);
	END IF;

	-- Save previous bidder for notification
	v_prev_bidder_id := v_listing.current_bidder_id;

	-- Mark previous active bid as outbid
	UPDATE bids
	SET status = 'outbid'
	WHERE listing_id = p_listing_id AND status = 'active';

	-- Insert the new bid
	INSERT INTO bids (listing_id, bidder_id, amount, status)
	VALUES (p_listing_id, v_bidder_id, p_amount, 'active')
	RETURNING id INTO v_new_bid_id;

	-- Update listing with current bid
	UPDATE listings
	SET current_bid = p_amount,
		current_bidder_id = v_bidder_id,
		updated_at = now()
	WHERE id = p_listing_id;

	-- Anti-snipe: extend auction if bid within anti_snipe window
	IF v_auction.auction_end_at - now() < (v_auction.anti_snipe_minutes || ' minutes')::interval THEN
		UPDATE auction_config
		SET auction_end_at = now() + (v_auction.anti_snipe_minutes || ' minutes')::interval,
			updated_at = now()
		WHERE listing_id = p_listing_id;
	END IF;

	-- Notify outbid user
	IF v_prev_bidder_id IS NOT NULL AND v_prev_bidder_id != v_bidder_id THEN
		INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
		VALUES (
			v_prev_bidder_id,
			'outbid',
			'You have been outbid',
			'Someone placed a higher bid of Rs. ' || p_amount || ' on ' || v_listing.title,
			'listing',
			p_listing_id
		);
	END IF;

	-- Check for auto-bids from other users
	SELECT * INTO v_auto
	FROM auto_bids
	WHERE listing_id = p_listing_id
		AND user_id != v_bidder_id
		AND is_active = true
		AND max_amount >= p_amount + v_auction.min_increment
	ORDER BY max_amount DESC
	LIMIT 1;

	-- If an auto-bid can outbid, place it
	IF v_auto IS NOT NULL THEN
		v_counter_amount := LEAST(
			v_auto.max_amount,
			p_amount + v_auction.min_increment
		);

		-- Mark current bid as outbid
		UPDATE bids SET status = 'outbid' WHERE id = v_new_bid_id;

		-- Place auto-bid
		INSERT INTO bids (listing_id, bidder_id, amount, status, is_auto_bid)
		VALUES (p_listing_id, v_auto.user_id, v_counter_amount, 'active', true);

		UPDATE listings
		SET current_bid = v_counter_amount,
			current_bidder_id = v_auto.user_id,
			updated_at = now()
		WHERE id = p_listing_id;

		-- Notify the manual bidder they've been outbid
		INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
		VALUES (
			v_bidder_id,
			'outbid',
			'You have been outbid',
			'An auto-bid of Rs. ' || v_counter_amount || ' was placed on ' || v_listing.title,
			'listing',
			p_listing_id
		);

		-- Deactivate auto-bid if max reached
		IF v_counter_amount >= v_auto.max_amount THEN
			UPDATE auto_bids SET is_active = false, updated_at = now()
			WHERE id = v_auto.id;
		END IF;
	END IF;

	RETURN jsonb_build_object(
		'success', true,
		'bid_id', v_new_bid_id,
		'current_bid', COALESCE(v_counter_amount, p_amount),
		'current_bidder_id', COALESCE(v_auto.user_id, v_bidder_id)
	);
END;
$$;


-- -------------------------------------------------------
-- 2. Transition Order Status (state machine)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION transition_order(
	p_order_id uuid,
	p_new_status order_status,
	p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
	v_order orders%ROWTYPE;
	v_user_id uuid := auth.uid();
	v_allowed boolean := false;
	v_timestamp_col text;
BEGIN

	SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

	IF v_order IS NULL THEN
		RETURN jsonb_build_object('error', 'Order not found');
	END IF;

	-- Validate transition is legal
	v_allowed := CASE v_order.status
		WHEN 'awaiting_payment'  THEN p_new_status = 'payment_received' OR p_new_status = 'cancelled'
		WHEN 'payment_received'  THEN p_new_status = 'shipped_to_center'
		WHEN 'shipped_to_center' THEN p_new_status = 'under_testing'
		WHEN 'under_testing'     THEN p_new_status = 'testing_complete'
		WHEN 'testing_complete'  THEN p_new_status IN ('approved', 'rejected')
		WHEN 'approved'          THEN p_new_status = 'shipped_to_buyer'
		WHEN 'rejected'          THEN p_new_status = 'refunded'
		WHEN 'shipped_to_buyer'  THEN p_new_status = 'delivered'
		WHEN 'delivered'         THEN p_new_status = 'completed'
		ELSE false
	END;

	IF NOT v_allowed THEN
		RETURN jsonb_build_object(
			'error', 'Invalid transition',
			'from', v_order.status,
			'to', p_new_status
		);
	END IF;

	-- Set the appropriate timestamp
	UPDATE orders
	SET status = p_new_status,
		updated_at = now(),
		paid_at = CASE WHEN p_new_status = 'payment_received' THEN now() ELSE paid_at END,
		shipped_to_center_at = CASE WHEN p_new_status = 'shipped_to_center' THEN now() ELSE shipped_to_center_at END,
		received_at_center_at = CASE WHEN p_new_status = 'under_testing' THEN now() ELSE received_at_center_at END,
		testing_completed_at = CASE WHEN p_new_status = 'testing_complete' THEN now() ELSE testing_completed_at END,
		approved_at = CASE WHEN p_new_status = 'approved' THEN now() ELSE approved_at END,
		rejected_at = CASE WHEN p_new_status = 'rejected' THEN now() ELSE rejected_at END,
		shipped_to_buyer_at = CASE WHEN p_new_status = 'shipped_to_buyer' THEN now() ELSE shipped_to_buyer_at END,
		delivered_at = CASE WHEN p_new_status = 'delivered' THEN now() ELSE delivered_at END,
		completed_at = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END,
		cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END
	WHERE id = p_order_id;

	-- Notify both parties
	INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
	VALUES
		(v_order.buyer_id, 'order_status', 'Order updated', 'Your order status changed to ' || p_new_status, 'order', p_order_id),
		(v_order.seller_id, 'order_status', 'Order updated', 'Order status changed to ' || p_new_status, 'order', p_order_id);

	RETURN jsonb_build_object(
		'success', true,
		'order_id', p_order_id,
		'new_status', p_new_status
	);
END;
$$;


-- -------------------------------------------------------
-- 3. Create Buy Now Order
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION create_buy_now_order(
	p_listing_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
	v_listing listings%ROWTYPE;
	v_buyer_id uuid := auth.uid();
	v_order_id uuid;
BEGIN

	SELECT * INTO v_listing FROM listings WHERE id = p_listing_id FOR UPDATE;

	IF v_listing IS NULL OR v_listing.deleted_at IS NOT NULL THEN
		RETURN jsonb_build_object('error', 'Listing not found');
	END IF;

	IF v_listing.status != 'active' THEN
		RETURN jsonb_build_object('error', 'Listing is not active');
	END IF;

	IF v_listing.sale_type = 'auction' THEN
		RETURN jsonb_build_object('error', 'This listing is auction-only');
	END IF;

	IF v_listing.user_id = v_buyer_id THEN
		RETURN jsonb_build_object('error', 'Cannot buy your own listing');
	END IF;

	-- Create the order
	INSERT INTO orders (listing_id, buyer_id, seller_id, amount)
	VALUES (p_listing_id, v_buyer_id, v_listing.user_id, v_listing.price)
	RETURNING id INTO v_order_id;

	-- Mark listing as sold
	UPDATE listings
	SET status = 'sold',
		sold_at = now(),
		updated_at = now()
	WHERE id = p_listing_id;

	-- Notify seller
	INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
	VALUES (
		v_listing.user_id,
		'order_status',
		'Your listing has been sold!',
		v_listing.title || ' was purchased for Rs. ' || v_listing.price,
		'order',
		v_order_id
	);

	RETURN jsonb_build_object(
		'success', true,
		'order_id', v_order_id
	);
END;
$$;


-- -------------------------------------------------------
-- 4. Mark Messages Read
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION mark_messages_read(
	p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
	v_user_id uuid := auth.uid();
	v_conv conversations%ROWTYPE;
	v_count integer;
BEGIN

	SELECT * INTO v_conv FROM conversations WHERE id = p_conversation_id;

	IF v_conv IS NULL THEN
		RETURN;
	END IF;

	-- Verify user is participant
	IF v_user_id NOT IN (v_conv.buyer_id, v_conv.seller_id) THEN
		RETURN;
	END IF;

	-- Mark unread messages from the OTHER user as read
	UPDATE messages
	SET read_at = now()
	WHERE conversation_id = p_conversation_id
		AND sender_id != v_user_id
		AND read_at IS NULL;

	GET DIAGNOSTICS v_count = ROW_COUNT;

	-- Reset unread counter
	IF v_user_id = v_conv.buyer_id THEN
		UPDATE conversations SET unread_count_buyer = 0 WHERE id = p_conversation_id;
	ELSE
		UPDATE conversations SET unread_count_seller = 0 WHERE id = p_conversation_id;
	END IF;
END;
$$;


-- -------------------------------------------------------
-- 5. Update Search Vector (called by trigger)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

	NEW.search_vector :=
		setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
		setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
		setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
		setweight(to_tsvector('english', COALESCE(NEW.details ->> 'color', '')), 'D');

	RETURN NEW;
END;
$$;


-- -------------------------------------------------------
-- 6. Check Listing Limit (subscription enforcement)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION check_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	v_max_listings integer;
	v_current_count integer;
BEGIN

	-- Get max active listings from subscription (default 5 for free)
	SELECT COALESCE(s.max_active_listings, 5)
	INTO v_max_listings
	FROM subscriptions s
	WHERE s.user_id = NEW.user_id AND s.is_active = true
	ORDER BY s.created_at DESC
	LIMIT 1;

	-- If no subscription found, use free tier default
	IF v_max_listings IS NULL THEN
		v_max_listings := 5;
	END IF;

	-- Count current active listings
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
