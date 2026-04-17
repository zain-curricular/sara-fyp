-- ============================================================================
-- Scheduled Jobs (pg_cron)
-- ============================================================================
--
-- Recurring maintenance tasks. pg_cron is available on Supabase Pro+ plans.
-- On free tier, these can be replaced by Edge Function cron triggers.
--


-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- -------------------------------------------------------
-- Expire ended auctions (every minute)
-- -------------------------------------------------------
-- Finds auctions past their end time, determines winner,
-- creates order, and notifies both parties.

CREATE OR REPLACE FUNCTION expire_ended_auctions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	v_auction record;
	v_listing public.listings%ROWTYPE;
	v_order_id uuid;
BEGIN

	FOR v_auction IN
		SELECT ac.listing_id, ac.auction_end_at
		FROM public.auction_config ac
		JOIN public.listings l ON l.id = ac.listing_id
		WHERE l.status = 'active'
			AND l.sale_type IN ('auction', 'both')
			AND ac.auction_end_at <= now()
		FOR UPDATE OF l SKIP LOCKED
	LOOP
		SELECT * INTO v_listing FROM public.listings WHERE id = v_auction.listing_id;

		IF v_listing.current_bidder_id IS NOT NULL THEN
			-- Winner exists — create order
			INSERT INTO public.orders (listing_id, buyer_id, seller_id, amount)
			VALUES (v_listing.id, v_listing.current_bidder_id, v_listing.user_id, v_listing.current_bid)
			RETURNING id INTO v_order_id;

			-- Mark winning bid
			UPDATE public.bids
			SET status = 'won'
			WHERE listing_id = v_listing.id AND status = 'active';

			-- Mark all other bids as lost
			UPDATE public.bids
			SET status = 'lost'
			WHERE listing_id = v_listing.id AND status = 'outbid';

			-- Update listing status
			UPDATE public.listings
			SET status = 'sold', sold_at = now(), updated_at = now()
			WHERE id = v_listing.id;

			-- Notify winner
			INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
			VALUES (
				v_listing.current_bidder_id,
				'auction_won',
				'You won the auction!',
				'You won ' || v_listing.title || ' for Rs. ' || v_listing.current_bid,
				'order',
				v_order_id
			);

			-- Notify seller
			INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
			VALUES (
				v_listing.user_id,
				'auction_sold',
				'Your auction has ended!',
				v_listing.title || ' sold for Rs. ' || v_listing.current_bid,
				'order',
				v_order_id
			);

		ELSE
			-- No bids — mark as expired
			UPDATE public.listings
			SET status = 'expired', updated_at = now()
			WHERE id = v_listing.id;

			INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
			VALUES (
				v_listing.user_id,
				'order_status',
				'Auction ended with no bids',
				v_listing.title || ' received no bids. You can relist it.',
				'listing',
				v_listing.id
			);
		END IF;
	END LOOP;
END;
$$;

SELECT cron.schedule(
	'expire-auctions',
	'* * * * *',
	$$SELECT expire_ended_auctions()$$
);


-- -------------------------------------------------------
-- Expire stale listings (daily at 3 AM)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION expire_stale_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

	UPDATE public.listings
	SET status = 'expired', updated_at = now()
	WHERE status = 'active'
		AND expires_at IS NOT NULL
		AND expires_at <= now();
END;
$$;

SELECT cron.schedule(
	'expire-listings',
	'0 3 * * *',
	$$SELECT expire_stale_listings()$$
);


-- -------------------------------------------------------
-- Clean temp uploads older than 1 hour (every hour)
-- -------------------------------------------------------

SELECT cron.schedule(
	'cleanup-temp-uploads',
	'0 * * * *',
	$$DELETE FROM storage.objects WHERE bucket_id = 'temp-uploads' AND created_at < now() - interval '1 hour'$$
);


-- -------------------------------------------------------
-- Refresh materialized views (every 15 minutes)
-- -------------------------------------------------------

SELECT cron.schedule(
	'refresh-category-counts',
	'*/15 * * * *',
	$$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_counts$$
);

SELECT cron.schedule(
	'refresh-trending',
	'*/15 * * * *',
	$$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_listings$$
);

SELECT cron.schedule(
	'refresh-admin-stats',
	'*/15 * * * *',
	$$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_admin_daily_stats$$
);


-- -------------------------------------------------------
-- Expire warranties (daily at 4 AM)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION expire_warranties()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

	-- Notify buyers 7 days before expiry
	INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
	SELECT
		w.buyer_id,
		'warranty_expiring',
		'Warranty expiring soon',
		'Your warranty expires in 7 days',
		'warranty',
		w.id
	FROM public.warranties w
	WHERE w.status = 'active'
		AND w.expires_at BETWEEN now() AND now() + interval '7 days'
		AND NOT EXISTS (
			SELECT 1 FROM public.notifications n
			WHERE n.entity_id = w.id
			AND n.type = 'warranty_expiring'
		);

	-- Expire past-due warranties
	UPDATE public.warranties
	SET status = 'expired', updated_at = now()
	WHERE status = 'active'
		AND expires_at <= now();
END;
$$;

SELECT cron.schedule(
	'expire-warranties',
	'0 4 * * *',
	$$SELECT expire_warranties()$$
);
