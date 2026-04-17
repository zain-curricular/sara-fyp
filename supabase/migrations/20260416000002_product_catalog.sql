-- ============================================================================
-- Product Catalog (Multi-Platform)
-- ============================================================================
--
-- Generic product catalog shared between mobile and automotive platforms.
-- Platform-specific differences live in JSONB columns:
--   - categories.spec_schema  → defines which fields a category expects
--   - specifications.specs    → actual spec values matching that schema
--
-- Structure:
--   categories  → hierarchical (Phones > Smartphones, Cars > Sedans > …)
--   brands      → manufacturer (Apple, Toyota) scoped to platform
--   models      → specific product (iPhone 15 Pro, Corolla 2024)
--   specifications → 1:1 with model, JSONB spec sheet
--
-- Admin-managed — not user-generated content.
--


-- -------------------------------------------------------
-- Categories (hierarchical, per platform)
-- -------------------------------------------------------

CREATE TABLE categories (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	platform platform_type NOT NULL,
	name text NOT NULL,
	slug text NOT NULL,
	parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
	icon_url text,
	position smallint NOT NULL DEFAULT 0,
	is_active boolean NOT NULL DEFAULT true,

	-- Defines expected fields in listings.details and specifications.specs
	-- for this category. Validated by Zod on the frontend.
	-- Example (mobile): { "ram_gb": "number", "storage_gb": "number", "pta_status": "string" }
	-- Example (automotive): { "engine_cc": "number", "fuel_type": "string", "mileage_km": "number" }
	spec_schema jsonb DEFAULT '{}',

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),

	UNIQUE (platform, slug)
);

COMMENT ON TABLE categories IS 'Hierarchical product categories scoped by platform. Admin-managed.';

CREATE INDEX idx_categories_platform ON categories (platform, parent_id);


-- -------------------------------------------------------
-- Brands (per platform)
-- -------------------------------------------------------

CREATE TABLE brands (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	platform platform_type NOT NULL,
	name text NOT NULL,
	slug text NOT NULL,
	logo_url text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),

	UNIQUE (platform, slug)
);

COMMENT ON TABLE brands IS 'Product manufacturers scoped by platform (Apple, Samsung, Toyota, Honda …).';


-- -------------------------------------------------------
-- Models
-- -------------------------------------------------------

CREATE TABLE models (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
	category_id uuid NOT NULL REFERENCES categories(id),
	name text NOT NULL,
	slug text NOT NULL,
	year smallint,
	image_url text,
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),

	UNIQUE (brand_id, slug)
);

COMMENT ON TABLE models IS 'Specific product models within a brand (iPhone 15 Pro, Civic 2024).';

CREATE INDEX idx_models_brand ON models (brand_id);
CREATE INDEX idx_models_category ON models (category_id);
CREATE INDEX idx_models_name ON models USING gin (name gin_trgm_ops);


-- -------------------------------------------------------
-- Specifications (1:1 with model, JSONB)
-- -------------------------------------------------------

CREATE TABLE specifications (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	model_id uuid NOT NULL UNIQUE REFERENCES models(id) ON DELETE CASCADE,

	-- All specs in JSONB — structure varies by platform/category.
	--
	-- Mobile example:
	-- { "network_bands": {...}, "display_type": "OLED", "ram_options_gb": [4,6,8],
	--   "storage_options_gb": [128,256], "battery_mah": 4500, "chipset": "A17 Pro", ... }
	--
	-- Automotive example:
	-- { "engine_cc": 1800, "fuel_type": "petrol", "transmission": "automatic",
	--   "horsepower": 140, "torque_nm": 175, "drive_type": "FWD",
	--   "seating_capacity": 5, "boot_litres": 470, ... }
	specs jsonb NOT NULL DEFAULT '{}',

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE specifications IS 'Full spec sheet for a model. JSONB structure defined by category.spec_schema.';
