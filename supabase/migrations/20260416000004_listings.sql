-- ============================================================================
-- Listings & Listing Images
-- ============================================================================
--
-- Core marketplace entity. A listing represents a product for sale — either
-- at a fixed price, via auction, or both. Product-specific attributes live
-- in the `details` JSONB column; the structure is defined by the listing's
-- category.spec_schema and validated by Zod on the frontend.
--
-- Images are a separate table (not an array) so we get proper ordering,
-- individual deletion, and a clean Storage reference per row.
--


-- -------------------------------------------------------
-- Enable pg_trgm for fuzzy search
-- -------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- -------------------------------------------------------
-- Listings
-- -------------------------------------------------------

CREATE TABLE listings (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id),
	platform platform_type NOT NULL,
	category_id uuid NOT NULL REFERENCES categories(id),
	model_id uuid REFERENCES models(id),

	-- Basic info
	title text NOT NULL,
	description text,
	ai_description text,

	-- Pricing
	sale_type sale_type NOT NULL DEFAULT 'fixed',
	price numeric(12,2) NOT NULL CHECK (price > 0),
	is_negotiable boolean NOT NULL DEFAULT false,

	-- Condition
	condition item_condition NOT NULL,

	-- Product-specific attributes (JSONB — schema varies by platform/category)
	--
	-- Mobile example:
	-- { "ram_gb": 8, "storage_gb": 256, "color": "Black",
	--   "battery_health_pct": 92, "pta_status": "approved" }
	--
	-- Automotive example:
	-- { "mileage_km": 45000, "fuel_type": "petrol", "transmission": "automatic",
	--   "color": "White", "engine_cc": 1800, "registered_city": "Lahore" }
	details jsonb NOT NULL DEFAULT '{}',

	-- AI-generated rating: { overall: 8, ... } — keys vary by platform
	ai_rating jsonb,

	-- Location
	city text NOT NULL,
	area text,

	-- Status
	status listing_status NOT NULL DEFAULT 'draft',

	-- Auction state (denormalized for quick reads on browse pages)
	current_bid numeric(12,2),
	current_bidder_id uuid REFERENCES profiles(id),

	-- Full-text search vector (maintained by trigger)
	search_vector tsvector,

	-- Timestamps
	published_at timestamptz,
	expires_at timestamptz,
	sold_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	deleted_at timestamptz
);

COMMENT ON TABLE listings IS 'Product listings — the core marketplace entity. Platform-agnostic.';


-- -------------------------------------------------------
-- Listing images
-- -------------------------------------------------------

CREATE TABLE listing_images (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
	storage_path text NOT NULL,
	url text NOT NULL,
	position smallint NOT NULL DEFAULT 0,
	created_at timestamptz NOT NULL DEFAULT now(),

	CONSTRAINT valid_position CHECK (position >= 0 AND position < 10)
);

COMMENT ON TABLE listing_images IS 'Photos for a listing. Max 10, ordered by position.';

CREATE INDEX idx_listing_images_listing ON listing_images (listing_id, position);
