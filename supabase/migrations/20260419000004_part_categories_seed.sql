-- ============================================================================
-- Part Categories (Hierarchical) + Seed
-- ============================================================================

CREATE TABLE IF NOT EXISTS part_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  parent_id   uuid REFERENCES part_categories(id) ON DELETE SET NULL,
  icon        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_part_categories_parent ON part_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_part_categories_slug   ON part_categories (slug);

ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "part_categories_public_select" ON part_categories FOR SELECT USING (true);
CREATE POLICY "part_categories_admin_all" ON part_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- ---------------------------------------------------------------------------
-- Seed: Top-level categories
-- ---------------------------------------------------------------------------
WITH top AS (
  INSERT INTO part_categories (name, slug, icon) VALUES
    ('Engine',           'engine',           '⚙️'),
    ('Transmission',     'transmission',     '🔧'),
    ('Suspension',       'suspension',       '🔩'),
    ('Brakes',           'brakes',           '🛑'),
    ('Electrical',       'electrical',       '⚡'),
    ('Body',             'body',             '🚗'),
    ('Interior',         'interior',         '🪑'),
    ('Lights',           'lights',           '💡'),
    ('Filters',          'filters',          '🔲'),
    ('Tyres & Wheels',   'tyres-wheels',     '⭕'),
    ('Cooling',          'cooling',          '❄️'),
    ('Exhaust',          'exhaust',          '💨'),
    ('Fuel System',      'fuel-system',      '⛽'),
    ('Steering',         'steering',         '🎡'),
    ('AC & Heating',     'ac-heating',       '🌡️')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
)
-- Seed sub-categories for Engine
INSERT INTO part_categories (name, slug, parent_id)
SELECT name, sub_slug, top.id
FROM top
JOIN (VALUES
  ('engine', 'Pistons & Rings',    'engine-pistons-rings'),
  ('engine', 'Crankshaft',         'engine-crankshaft'),
  ('engine', 'Camshaft',           'engine-camshaft'),
  ('engine', 'Cylinder Head',      'engine-cylinder-head'),
  ('engine', 'Gaskets & Seals',    'engine-gaskets-seals'),
  ('engine', 'Oil Pump',           'engine-oil-pump'),
  ('engine', 'Timing Belt/Chain',  'engine-timing'),
  ('brakes', 'Brake Pads',         'brakes-pads'),
  ('brakes', 'Brake Discs/Rotors', 'brakes-discs'),
  ('brakes', 'Calipers',           'brakes-calipers'),
  ('brakes', 'Brake Fluid',        'brakes-fluid'),
  ('filters', 'Oil Filter',        'filters-oil'),
  ('filters', 'Air Filter',        'filters-air'),
  ('filters', 'Fuel Filter',       'filters-fuel'),
  ('filters', 'Cabin Filter',      'filters-cabin'),
  ('electrical', 'Alternator',     'electrical-alternator'),
  ('electrical', 'Starter Motor',  'electrical-starter'),
  ('electrical', 'Battery',        'electrical-battery'),
  ('electrical', 'Sensors',        'electrical-sensors'),
  ('suspension', 'Shock Absorbers','suspension-shocks'),
  ('suspension', 'Struts',         'suspension-struts'),
  ('suspension', 'Bushings',       'suspension-bushings'),
  ('suspension', 'Tie Rods',       'suspension-tierods'),
  ('cooling',  'Radiator',         'cooling-radiator'),
  ('cooling',  'Water Pump',       'cooling-waterpump'),
  ('cooling',  'Thermostat',       'cooling-thermostat'),
  ('cooling',  'Cooling Fan',      'cooling-fan'),
  ('lights',   'Headlights',       'lights-headlights'),
  ('lights',   'Taillights',       'lights-taillights'),
  ('lights',   'Fog Lights',       'lights-foglights'),
  ('lights',   'Bulbs',            'lights-bulbs')
) AS sub(parent_slug, name, sub_slug) ON top.slug = sub.parent_slug
ON CONFLICT (slug) DO NOTHING;
