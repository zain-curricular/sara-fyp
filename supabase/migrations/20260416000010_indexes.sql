-- ============================================================================
-- Performance Indexes
-- ============================================================================
--
-- Indexes targeting the primary query patterns. Tables already have basic
-- indexes from their migration files — this file adds the composite and
-- partial indexes that drive marketplace browse/search performance.
--
-- Principle: partial indexes on status = 'active' keep index size small
-- as sold/expired listings accumulate. Platform column appears in most
-- composite indexes since each frontend only queries its own platform.
--


-- -------------------------------------------------------
-- Listings — browse & search
-- -------------------------------------------------------

-- Browse by platform + city (the #1 query — each frontend is location-first)
CREATE INDEX idx_listings_platform_city ON listings (platform, city, created_at DESC)
	WHERE status = 'active' AND deleted_at IS NULL;

-- Filter by category within a platform
CREATE INDEX idx_listings_platform_category ON listings (platform, category_id, created_at DESC)
	WHERE status = 'active' AND deleted_at IS NULL;

-- Filter by model (brand implied via model → brand FK)
CREATE INDEX idx_listings_model_active ON listings (model_id, price)
	WHERE status = 'active' AND deleted_at IS NULL;

-- Price range filter per platform
CREATE INDEX idx_listings_platform_price ON listings (platform, price)
	WHERE status = 'active' AND deleted_at IS NULL;

-- Condition filter
CREATE INDEX idx_listings_condition_active ON listings (condition, created_at DESC)
	WHERE status = 'active' AND deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_listings_search ON listings USING gin (search_vector)
	WHERE status = 'active' AND deleted_at IS NULL;

-- Fuzzy title search (pg_trgm)
CREATE INDEX idx_listings_title_trgm ON listings USING gin (title gin_trgm_ops);

-- User's own listings (seller dashboard)
CREATE INDEX idx_listings_user ON listings (user_id, status, created_at DESC)
	WHERE deleted_at IS NULL;

-- Expiring listings (for pg_cron cleanup)
CREATE INDEX idx_listings_expiry ON listings (expires_at)
	WHERE status = 'active' AND expires_at IS NOT NULL;

-- JSONB details — GIN index for @> containment queries
-- e.g. WHERE details @> '{"fuel_type": "petrol"}' or details @> '{"pta_status": "approved"}'
CREATE INDEX idx_listings_details ON listings USING gin (details)
	WHERE status = 'active' AND deleted_at IS NULL;


-- -------------------------------------------------------
-- Auctions — active auction queries
-- -------------------------------------------------------

-- Auctions ending soon (for browse + pg_cron expiry job)
CREATE INDEX idx_auction_ending ON auction_config (auction_end_at)
	WHERE auction_end_at > now();


-- -------------------------------------------------------
-- Orders — stuck order monitoring
-- -------------------------------------------------------

-- Orders in intermediate states (admin monitoring)
CREATE INDEX idx_orders_active_status ON orders (status, updated_at)
	WHERE status NOT IN ('completed', 'cancelled', 'refunded');
