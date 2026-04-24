-- ============================================================================
-- Mechanic Verifications, Fraud Signals, Admin Actions
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Mechanics profile extension
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mechanics (
  id             uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialties    text[] NOT NULL DEFAULT '{}',
  service_areas  text[] NOT NULL DEFAULT '{}',
  hourly_rate    numeric(10,2),
  verified_at    timestamptz,
  total_jobs     int NOT NULL DEFAULT 0,
  rating         numeric(3,2) NOT NULL DEFAULT 0
);

ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mechanics_public_select" ON mechanics FOR SELECT USING (true);
CREATE POLICY "mechanics_owner_all"     ON mechanics FOR ALL USING (id = auth.uid());
CREATE POLICY "mechanics_admin_all"     ON mechanics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- ---------------------------------------------------------------------------
-- Mechanic verification requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mechanic_verifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id       uuid REFERENCES listings(id) ON DELETE SET NULL,
  vehicle_id       uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_details  jsonb,
  mechanic_id      uuid REFERENCES mechanics(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','assigned','verified_compatible','verified_incompatible','rejected','expired'
  )),
  mechanic_notes   text,
  fee              numeric(10,2) NOT NULL DEFAULT 0,
  paid             boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  responded_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mv_requester ON mechanic_verifications (requester_id);
CREATE INDEX IF NOT EXISTS idx_mv_mechanic  ON mechanic_verifications (mechanic_id) WHERE mechanic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mv_status    ON mechanic_verifications (status);

ALTER TABLE mechanic_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mv_requester_select" ON mechanic_verifications FOR SELECT USING (
  requester_id = auth.uid() OR mechanic_id = auth.uid()
);
CREATE POLICY "mv_requester_insert" ON mechanic_verifications FOR INSERT WITH CHECK (
  requester_id = auth.uid()
);
CREATE POLICY "mv_mechanic_update" ON mechanic_verifications FOR UPDATE USING (
  mechanic_id = auth.uid()
);
CREATE POLICY "mv_admin_all" ON mechanic_verifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- Pending pool visible to all verified mechanics
CREATE POLICY "mv_mechanic_pool_select" ON mechanic_verifications FOR SELECT USING (
  status = 'pending'
  AND EXISTS (SELECT 1 FROM mechanics m WHERE m.id = auth.uid() AND m.verified_at IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Fraud signals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fraud_signals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('listing','seller','order','user')),
  subject_id   uuid NOT NULL,
  signal_type  text NOT NULL,
  score        numeric(5,2) NOT NULL DEFAULT 0,
  details      jsonb NOT NULL DEFAULT '{}',
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','actioned')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_status  ON fraud_signals (status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_fraud_subject ON fraud_signals (subject_type, subject_id);

ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fraud_admin_all" ON fraud_signals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- ---------------------------------------------------------------------------
-- Admin actions (audit log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type  text NOT NULL,
  target_type  text NOT NULL,
  target_id    uuid,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_actor  ON admin_actions (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions (target_type, target_id);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_actions_admin_all" ON admin_actions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);
