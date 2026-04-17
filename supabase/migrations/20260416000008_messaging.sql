-- ============================================================================
-- Conversations & Messages
-- ============================================================================
--
-- One conversation per unique (listing, buyer, seller) triple — prevents
-- duplicate threads. Messages are immutable (no edit/delete from client).
--
-- Unread counters are maintained by trigger on message insert.
-- Real-time delivery uses Supabase Realtime subscriptions filtered by
-- conversation_id, with RLS ensuring only participants receive events.
--


-- -------------------------------------------------------
-- Conversations
-- -------------------------------------------------------

CREATE TABLE conversations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id uuid NOT NULL REFERENCES listings(id),
	buyer_id uuid NOT NULL REFERENCES profiles(id),
	seller_id uuid NOT NULL REFERENCES profiles(id),

	last_message_at timestamptz,
	last_message_preview text,
	unread_count_buyer integer NOT NULL DEFAULT 0,
	unread_count_seller integer NOT NULL DEFAULT 0,

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),

	UNIQUE (listing_id, buyer_id, seller_id)
);

COMMENT ON TABLE conversations IS 'Chat thread between buyer and seller about a specific listing.';

CREATE INDEX idx_conversations_buyer ON conversations (buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations (seller_id, last_message_at DESC);


-- -------------------------------------------------------
-- Messages
-- -------------------------------------------------------

CREATE TABLE messages (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
	sender_id uuid NOT NULL REFERENCES profiles(id),
	content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
	read_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE messages IS 'Individual chat messages. Immutable — no client edit/delete.';

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages (conversation_id, read_at) WHERE read_at IS NULL;
