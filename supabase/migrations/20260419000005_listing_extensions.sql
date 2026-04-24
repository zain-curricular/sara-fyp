-- ============================================================================
-- Listing Extensions for ShopSmart
-- ============================================================================
-- Augments the existing `listings` table with spare-parts-specific columns.
-- Existing columns and RLS policies are preserved.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS store_id          uuid REFERENCES seller_stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug              text,
  ADD COLUMN IF NOT EXISTS compare_at_price  numeric(12,2),
  ADD COLUMN IF NOT EXISTS min_order_qty     int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_wholesale      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock             int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ai_generated_fields jsonb,
  ADD COLUMN IF NOT EXISTS listing_condition text
    CHECK (listing_condition IN ('new','used','refurbished','oem','aftermarket')),
  ADD COLUMN IF NOT EXISTS embedding         vector(1536),
  ADD COLUMN IF NOT EXISTS part_category_id  uuid REFERENCES part_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_listings_store      ON listings (store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_embedding  ON listings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ---------------------------------------------------------------------------
-- Listing compatibility: which vehicles this part fits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_compatibility (
  listing_id  uuid NOT NULL REFERENCES listings(id)  ON DELETE CASCADE,
  vehicle_id  uuid NOT NULL REFERENCES vehicles(id)  ON DELETE CASCADE,
  year_from   int,
  year_to     int,
  PRIMARY KEY (listing_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_compat_vehicle ON listing_compatibility (vehicle_id);

ALTER TABLE listing_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compat_public_select" ON listing_compatibility FOR SELECT USING (true);
CREATE POLICY "compat_owner_write" ON listing_compatibility FOR ALL USING (
  EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
);
