-- ============================================================================
-- ShopSmart Orders Extensions + Status Events + Disputes
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extend existing orders table with ShopSmart-specific fields
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number     text UNIQUE,
  ADD COLUMN IF NOT EXISTS store_id         uuid REFERENCES seller_stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ss_status        text NOT NULL DEFAULT 'pending_payment'
    CHECK (ss_status IN (
      'pending_payment','paid_escrow','accepted','shipped',
      'delivered','completed','disputed','refunded','cancelled'
    )),
  ADD COLUMN IF NOT EXISTS subtotal         numeric(12,2),
  ADD COLUMN IF NOT EXISTS shipping_fee     numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee     numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total            numeric(12,2),
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS tracking_number  text,
  ADD COLUMN IF NOT EXISTS courier_name     text,
  ADD COLUMN IF NOT EXISTS placed_at        timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at      timestamptz,
  ADD COLUMN IF NOT EXISTS shipped_at       timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at     timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at     timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_ss_status  ON orders (ss_status);
CREATE INDEX IF NOT EXISTS idx_orders_store       ON orders (store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number) WHERE order_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Extend escrow_transactions with ShopSmart fields
-- ---------------------------------------------------------------------------
ALTER TABLE escrow_transactions
  ADD COLUMN IF NOT EXISTS seller_payout    numeric(12,2),
  ADD COLUMN IF NOT EXISTS release_trigger  text,
  ADD COLUMN IF NOT EXISTS ss_status        text NOT NULL DEFAULT 'held'
    CHECK (ss_status IN ('held','released','refunded','disputed'));

-- ---------------------------------------------------------------------------
-- Order items (one row per product in an order)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id        uuid REFERENCES listings(id) ON DELETE SET NULL,
  listing_snapshot  jsonb NOT NULL,
  qty               int NOT NULL DEFAULT 1,
  unit_price        numeric(12,2) NOT NULL,
  line_total        numeric(12,2) NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_participant_select" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- Order status events (audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  text,
  to_status    text NOT NULL,
  actor_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ose_order ON order_status_events (order_id, created_at DESC);

ALTER TABLE order_status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ose_participant_select" ON order_status_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  )
);
CREATE POLICY "ose_admin_all" ON order_status_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- Allow order participants to insert status events via server action
CREATE POLICY "ose_participant_insert" ON order_status_events FOR INSERT WITH CHECK (
  actor_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- Disputes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disputes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  opened_by        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason           text NOT NULL CHECK (reason IN (
    'not_received','wrong_item','damaged','counterfeit','other'
  )),
  description      text NOT NULL,
  evidence_urls    jsonb NOT NULL DEFAULT '[]',
  status           text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','reviewing','resolved_buyer','resolved_seller','cancelled'
  )),
  resolution_note  text,
  resolved_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_disputes_order  ON disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status) WHERE status IN ('open','reviewing');
CREATE INDEX IF NOT EXISTS idx_disputes_opener ON disputes (opened_by);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_participant_select" ON disputes FOR SELECT USING (
  opened_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  )
);
CREATE POLICY "disputes_opener_insert" ON disputes FOR INSERT WITH CHECK (
  opened_by = auth.uid()
);
CREATE POLICY "disputes_admin_all" ON disputes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- ---------------------------------------------------------------------------
-- Realtime: order status events + disputes
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE order_status_events;
ALTER PUBLICATION supabase_realtime ADD TABLE disputes;
