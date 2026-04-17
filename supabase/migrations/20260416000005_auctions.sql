-- ============================================================================
-- Auction & Bidding System
-- ============================================================================
--
-- Auction config is a 1:1 extension of listings (only exists when
-- sale_type = 'auction' or 'both'). Bids are the transactional heart of the
-- auction system — placed via an atomic DB function, never direct INSERT.
--
-- Auto-bids let users set a maximum amount; the system counter-bids
-- automatically on their behalf up to that ceiling.
--


-- -------------------------------------------------------
-- Auction configuration (1:1 with listing)
-- -------------------------------------------------------

CREATE TABLE auction_config (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id uuid NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,

	starting_price numeric(12,2) NOT NULL CHECK (starting_price > 0),
	min_increment numeric(12,2) NOT NULL DEFAULT 100 CHECK (min_increment > 0),
	auction_start_at timestamptz NOT NULL DEFAULT now(),
	auction_end_at timestamptz NOT NULL,
	anti_snipe_minutes smallint NOT NULL DEFAULT 5 CHECK (anti_snipe_minutes BETWEEN 1 AND 30),

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),

	CONSTRAINT valid_auction_window CHECK (auction_end_at > auction_start_at)
);

COMMENT ON TABLE auction_config IS 'Auction parameters for a listing. 1:1 — only exists for auction/both sale types.';


-- -------------------------------------------------------
-- Bids
-- -------------------------------------------------------

CREATE TABLE bids (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id uuid NOT NULL REFERENCES listings(id),
	bidder_id uuid NOT NULL REFERENCES profiles(id),
	amount numeric(12,2) NOT NULL CHECK (amount > 0),
	status bid_status NOT NULL DEFAULT 'active',
	is_auto_bid boolean NOT NULL DEFAULT false,
	created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE bids IS 'Individual bids on auction listings. Created via place_bid() RPC, never direct INSERT.';

CREATE INDEX idx_bids_listing ON bids (listing_id, amount DESC);
CREATE INDEX idx_bids_bidder ON bids (bidder_id, created_at DESC);


-- -------------------------------------------------------
-- Auto-bids (proxy bidding)
-- -------------------------------------------------------

CREATE TABLE auto_bids (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES profiles(id),
	max_amount numeric(12,2) NOT NULL CHECK (max_amount > 0),
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),

	UNIQUE (listing_id, user_id)
);

COMMENT ON TABLE auto_bids IS 'Auto-bid ceiling per user per auction. System bids on behalf up to max_amount.';
