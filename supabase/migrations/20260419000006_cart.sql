-- ============================================================================
-- Cart & Cart Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS carts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id         uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  listing_id      uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  qty             int NOT NULL DEFAULT 1 CHECK (qty > 0),
  snapshot_price  numeric(12,2) NOT NULL,
  added_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart    ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_listing ON cart_items (listing_id);

ALTER TABLE carts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts_owner_all" ON carts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "cart_items_owner_all" ON cart_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  );

-- Auto-update carts.updated_at
CREATE OR REPLACE FUNCTION update_cart_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE carts SET updated_at = now() WHERE id = NEW.cart_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cart_items_updated
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_timestamp();
