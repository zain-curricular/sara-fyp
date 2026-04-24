-- ============================================================================
-- pgvector Extension + Seller Stores
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- seller_stores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_stores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_name    text NOT NULL,
  slug          text NOT NULL UNIQUE,
  logo_url      text,
  banner_url    text,
  city          text,
  description   text,
  verified      boolean NOT NULL DEFAULT false,
  rating        numeric(3,2) NOT NULL DEFAULT 0,
  review_count  int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_stores_owner ON seller_stores (owner_id);
CREATE INDEX IF NOT EXISTS idx_seller_stores_slug ON seller_stores (slug);

ALTER TABLE seller_stores ENABLE ROW LEVEL SECURITY;

-- Owner can read/update their store
CREATE POLICY "seller_stores_owner_all" ON seller_stores
  FOR ALL USING (owner_id = auth.uid());

-- Public can read active stores
CREATE POLICY "seller_stores_public_select" ON seller_stores
  FOR SELECT USING (true);

-- Admin can do anything
CREATE POLICY "seller_stores_admin_all" ON seller_stores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  );
