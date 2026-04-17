-- ============================================================================
-- Views & Materialized Views
-- ============================================================================
--
-- Regular views for common query patterns (PostgREST serves views like tables).
-- Materialized views for expensive aggregations (refreshed by pg_cron).
--
-- All views are platform-aware — frontends filter by platform column.
--


-- -------------------------------------------------------
-- Listing card view (browse pages)
-- -------------------------------------------------------
-- Joins listing + first image + seller name + brand/model + favorite count
-- in a single query. PostgREST clients query this like a table.

CREATE OR REPLACE VIEW listing_cards AS
SELECT
	l.id,
	l.platform,
	l.title,
	l.price,
	l.sale_type,
	l.condition,
	l.city,
	l.area,
	l.status,
	l.current_bid,
	l.ai_rating,
	l.details,
	l.is_negotiable,
	l.created_at,
	l.published_at,

	-- Seller info
	l.user_id AS seller_id,
	p.display_name AS seller_name,
	p.avatar_url AS seller_avatar,
	p.avg_rating AS seller_rating,
	p.is_verified AS seller_verified,

	-- Product info
	l.category_id,
	c.name AS category_name,
	m.name AS model_name,
	b.name AS brand_name,

	-- First image
	li.url AS image_url,

	-- Auction info
	ac.auction_end_at,
	ac.starting_price AS auction_starting_price,

	-- Aggregates
	(SELECT count(*) FROM favorites f WHERE f.listing_id = l.id) AS favorite_count

FROM listings l
LEFT JOIN profiles p ON p.id = l.user_id
LEFT JOIN categories c ON c.id = l.category_id
LEFT JOIN models m ON m.id = l.model_id
LEFT JOIN brands b ON b.id = m.brand_id
LEFT JOIN LATERAL (
	SELECT url FROM listing_images
	WHERE listing_id = l.id
	ORDER BY position
	LIMIT 1
) li ON true
LEFT JOIN auction_config ac ON ac.listing_id = l.id
WHERE l.deleted_at IS NULL;


-- -------------------------------------------------------
-- Listing detail view (single listing page)
-- -------------------------------------------------------

CREATE OR REPLACE VIEW listing_details AS
SELECT
	l.*,

	-- Seller
	p.display_name AS seller_name,
	p.avatar_url AS seller_avatar,
	p.avg_rating AS seller_rating,
	p.total_reviews AS seller_total_reviews,
	p.total_sales AS seller_total_sales,
	p.is_verified AS seller_verified,
	p.city AS seller_city,
	p.created_at AS seller_member_since,

	-- Product catalog
	c.name AS category_name,
	m.name AS model_name,
	b.name AS brand_name,
	b.slug AS brand_slug,
	s.specs AS model_specs,

	-- Auction
	ac.starting_price AS auction_starting_price,
	ac.min_increment AS auction_min_increment,
	ac.auction_start_at,
	ac.auction_end_at,
	ac.anti_snipe_minutes,

	-- Counts
	(SELECT count(*) FROM favorites f WHERE f.listing_id = l.id) AS favorite_count,
	(SELECT count(*) FROM bids bd WHERE bd.listing_id = l.id) AS bid_count

FROM listings l
LEFT JOIN profiles p ON p.id = l.user_id
LEFT JOIN categories c ON c.id = l.category_id
LEFT JOIN models m ON m.id = l.model_id
LEFT JOIN brands b ON b.id = m.brand_id
LEFT JOIN specifications s ON s.model_id = m.id
LEFT JOIN auction_config ac ON ac.listing_id = l.id
WHERE l.deleted_at IS NULL;


-- -------------------------------------------------------
-- Order detail view
-- -------------------------------------------------------

CREATE OR REPLACE VIEW order_details AS
SELECT
	o.*,

	-- Listing info
	l.title AS listing_title,
	l.platform AS listing_platform,
	li.url AS listing_image_url,

	-- Buyer
	bp.display_name AS buyer_name,
	bp.avatar_url AS buyer_avatar,

	-- Seller
	sp.display_name AS seller_name,
	sp.avatar_url AS seller_avatar,

	-- Test report
	tr.overall_score AS test_overall_score,
	tr.passed AS test_passed,

	-- Warranty
	w.id AS warranty_id,
	w.status AS warranty_status,
	w.expires_at AS warranty_expires_at

FROM orders o
LEFT JOIN listings l ON l.id = o.listing_id
LEFT JOIN LATERAL (
	SELECT url FROM listing_images
	WHERE listing_id = l.id
	ORDER BY position
	LIMIT 1
) li ON true
LEFT JOIN profiles bp ON bp.id = o.buyer_id
LEFT JOIN profiles sp ON sp.id = o.seller_id
LEFT JOIN test_reports tr ON tr.order_id = o.id
LEFT JOIN warranties w ON w.order_id = o.id;


-- -------------------------------------------------------
-- Materialized: category counts per platform (browse filters)
-- -------------------------------------------------------

CREATE MATERIALIZED VIEW mv_category_counts AS
SELECT
	l.platform,
	b.id AS brand_id,
	b.name AS brand_name,
	b.slug AS brand_slug,
	c.id AS category_id,
	c.name AS category_name,
	l.condition,
	l.city,
	count(*) AS listing_count
FROM listings l
JOIN categories c ON c.id = l.category_id
LEFT JOIN models m ON m.id = l.model_id
LEFT JOIN brands b ON b.id = m.brand_id
WHERE l.status = 'active' AND l.deleted_at IS NULL
GROUP BY l.platform, b.id, b.name, b.slug, c.id, c.name, l.condition, l.city;

CREATE UNIQUE INDEX idx_mv_category_counts
	ON mv_category_counts (platform, COALESCE(brand_id, '00000000-0000-0000-0000-000000000000'), category_id, condition, city);


-- -------------------------------------------------------
-- Materialized: trending listings per platform (homepage)
-- -------------------------------------------------------

CREATE MATERIALIZED VIEW mv_trending_listings AS
SELECT
	l.id AS listing_id,
	l.platform,
	count(DISTINCT vl.id) AS view_count,
	count(DISTINCT f.id) AS favorite_count,
	count(DISTINCT vl.id) + (count(DISTINCT f.id) * 3) AS trend_score
FROM listings l
LEFT JOIN viewed_listings vl ON vl.listing_id = l.id
	AND vl.viewed_at > now() - interval '24 hours'
LEFT JOIN favorites f ON f.listing_id = l.id
	AND f.created_at > now() - interval '24 hours'
WHERE l.status = 'active' AND l.deleted_at IS NULL
GROUP BY l.id, l.platform
HAVING count(DISTINCT vl.id) + count(DISTINCT f.id) > 0
ORDER BY trend_score DESC
LIMIT 200;

CREATE UNIQUE INDEX idx_mv_trending ON mv_trending_listings (listing_id);


-- -------------------------------------------------------
-- Materialized: admin analytics (across all platforms)
-- -------------------------------------------------------

CREATE MATERIALIZED VIEW mv_admin_daily_stats AS
SELECT
	date_trunc('day', created_at)::date AS stat_date,
	'signups' AS metric,
	NULL::platform_type AS platform,
	count(*) AS value
FROM profiles
GROUP BY stat_date

UNION ALL

SELECT
	date_trunc('day', published_at)::date AS stat_date,
	'listings_published' AS metric,
	l.platform,
	count(*) AS value
FROM listings l
WHERE published_at IS NOT NULL
GROUP BY stat_date, l.platform

UNION ALL

SELECT
	date_trunc('day', o.completed_at)::date AS stat_date,
	'orders_completed' AS metric,
	l.platform,
	count(*) AS value
FROM orders o
JOIN listings l ON l.id = o.listing_id
WHERE o.completed_at IS NOT NULL
GROUP BY stat_date, l.platform

UNION ALL

SELECT
	date_trunc('day', o.completed_at)::date AS stat_date,
	'revenue' AS metric,
	l.platform,
	sum(o.amount)::bigint AS value
FROM orders o
JOIN listings l ON l.id = o.listing_id
WHERE o.completed_at IS NOT NULL
GROUP BY stat_date, l.platform;

CREATE INDEX idx_mv_admin_stats ON mv_admin_daily_stats (stat_date, metric);
