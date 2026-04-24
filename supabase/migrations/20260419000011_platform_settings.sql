-- ============================================================================
-- Platform Settings
-- ============================================================================
--
-- Key-value store for platform-wide configuration managed by admins.
-- RLS: admins can read/write, public can only read.

CREATE TABLE IF NOT EXISTS platform_settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_admin_all" ON platform_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

CREATE POLICY "settings_public_select" ON platform_settings FOR SELECT USING (true);

INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee_pct', '3'),
  ('escrow_autorelease_days', '7'),
  ('min_listing_price', '100'),
  ('max_listing_price', '10000000')
ON CONFLICT DO NOTHING;
