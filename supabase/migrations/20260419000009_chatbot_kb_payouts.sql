-- ============================================================================
-- Chatbot Sessions, KB Documents, Payouts, Saved Addresses
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Chatbot sessions (multi-turn AI chat)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  messages         jsonb NOT NULL DEFAULT '[]',
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_message_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_user ON chatbot_sessions (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chatbot_owner_all" ON chatbot_sessions FOR ALL USING (
  user_id = auth.uid() OR user_id IS NULL
);

-- ---------------------------------------------------------------------------
-- Knowledge base documents (RAG)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  source     text,
  content    text NOT NULL,
  embedding  vector(1536),
  metadata   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_embedding ON kb_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_public_select" ON kb_documents FOR SELECT USING (true);
CREATE POLICY "kb_admin_all"     ON kb_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- ---------------------------------------------------------------------------
-- Seller payouts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          numeric(12,2) NOT NULL,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','processing','paid','failed'
  )),
  method          text,
  transaction_ref text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  paid_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts (status);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_seller_select" ON payouts FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "payouts_admin_all"     ON payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- ---------------------------------------------------------------------------
-- Saved addresses (buyer shipping addresses)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_addresses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT 'Home',
  full_name    text NOT NULL,
  phone        text NOT NULL,
  address_line text NOT NULL,
  city         text NOT NULL,
  province     text NOT NULL DEFAULT 'Punjab',
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON saved_addresses (user_id);

ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_owner_all" ON saved_addresses FOR ALL USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime for mechanic_verifications (status updates)
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE mechanic_verifications;
