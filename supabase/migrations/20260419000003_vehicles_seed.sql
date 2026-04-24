-- ============================================================================
-- Vehicles Table + Pakistani Vehicle Seed
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make        text NOT NULL,
  model       text NOT NULL,
  year_from   int NOT NULL,
  year_to     int,
  body_type   text,
  engine      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles (make, model);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_public_select" ON vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_admin_all" ON vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- ---------------------------------------------------------------------------
-- Seed: Pakistani vehicles (Suzuki, Toyota, Honda, KIA, Changan, Hyundai, MG, Proton, Haval)
-- ---------------------------------------------------------------------------
INSERT INTO vehicles (make, model, year_from, year_to, body_type, engine) VALUES
  -- Suzuki
  ('Suzuki', 'Mehran', 1988, 2019, 'Hatchback', '800cc'),
  ('Suzuki', 'Alto', 2019, NULL,  'Hatchback', '660cc-1000cc'),
  ('Suzuki', 'Cultus', 2000, NULL, 'Hatchback', '1000cc'),
  ('Suzuki', 'Swift', 2010, NULL, 'Hatchback', '1300cc'),
  ('Suzuki', 'Bolan', 1986, NULL, 'Van', '800cc'),
  ('Suzuki', 'Wagon R', 2014, NULL, 'Hatchback', '998cc'),
  -- Toyota
  ('Toyota', 'Corolla', 2002, NULL, 'Sedan', '1300cc-1800cc'),
  ('Toyota', 'Yaris', 2020, NULL, 'Sedan', '1300cc-1500cc'),
  ('Toyota', 'Vitz', 2006, 2018, 'Hatchback', '1000cc-1300cc'),
  ('Toyota', 'Hilux', 2005, NULL, 'Pickup', '2400cc-2800cc'),
  ('Toyota', 'Fortuner', 2016, NULL, 'SUV', '2700cc-2800cc'),
  -- Honda
  ('Honda', 'City',  2009, NULL, 'Sedan', '1200cc-1500cc'),
  ('Honda', 'Civic', 2016, NULL, 'Sedan', '1500cc-1800cc'),
  ('Honda', 'BR-V',  2017, NULL, 'Crossover', '1500cc'),
  -- KIA
  ('KIA', 'Sportage', 2021, NULL, 'SUV', '2000cc'),
  ('KIA', 'Picanto',  2020, NULL, 'Hatchback', '1000cc'),
  -- Changan
  ('Changan', 'Alsvin',  2021, NULL, 'Sedan', '1500cc'),
  ('Changan', 'Oshan X7',2022, NULL, 'SUV',   '1500cc'),
  -- Hyundai
  ('Hyundai', 'Tucson',  2021, NULL, 'SUV',   '2000cc'),
  ('Hyundai', 'Elantra', 2022, NULL, 'Sedan', '2000cc'),
  ('Hyundai', 'Porter',  2020, NULL, 'Pickup', '2500cc'),
  -- MG
  ('MG', 'HS',  2021, NULL, 'SUV', '1500cc'),
  ('MG', 'ZS',  2022, NULL, 'SUV', '1500cc'),
  -- Proton
  ('Proton', 'Saga', 2021, NULL, 'Sedan', '1300cc'),
  ('Proton', 'X70',  2022, NULL, 'SUV',   '1800cc'),
  -- Haval
  ('Haval', 'H6', 2021, NULL, 'SUV', '1500cc')
ON CONFLICT DO NOTHING;
