-- ============================================================================
-- Orders, Escrow & Device Testing
-- ============================================================================
--
-- Orders are created from "Buy Now" or auction wins. They follow a strict
-- state machine — every transition is validated by a DB function.
--
-- Escrow transactions track money movement (hold → release/refund).
-- Test reports are created by testing center staff during product inspection.
-- Inspection criteria vary by platform — stored as JSONB.
--


-- -------------------------------------------------------
-- Orders
-- -------------------------------------------------------

CREATE TABLE orders (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id uuid NOT NULL REFERENCES listings(id),
	buyer_id uuid NOT NULL REFERENCES profiles(id),
	seller_id uuid NOT NULL REFERENCES profiles(id),

	-- Final transaction amount
	amount numeric(12,2) NOT NULL CHECK (amount > 0),

	-- State machine
	status order_status NOT NULL DEFAULT 'awaiting_payment',

	-- Shipping
	shipping_tracking_to_center text,
	shipping_tracking_to_buyer text,

	-- Status timestamps (set by transition function)
	paid_at timestamptz,
	shipped_to_center_at timestamptz,
	received_at_center_at timestamptz,
	testing_completed_at timestamptz,
	approved_at timestamptz,
	rejected_at timestamptz,
	shipped_to_buyer_at timestamptz,
	delivered_at timestamptz,
	completed_at timestamptz,
	cancelled_at timestamptz,

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS 'Marketplace transactions. State machine from payment to delivery.';

CREATE INDEX idx_orders_buyer ON orders (buyer_id, status);
CREATE INDEX idx_orders_seller ON orders (seller_id, status);
CREATE INDEX idx_orders_listing ON orders (listing_id);
CREATE INDEX idx_orders_status ON orders (status) WHERE status NOT IN ('completed', 'cancelled', 'refunded');


-- -------------------------------------------------------
-- Escrow transactions
-- -------------------------------------------------------

CREATE TABLE escrow_transactions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id uuid NOT NULL REFERENCES orders(id),
	type escrow_tx_type NOT NULL,
	amount numeric(12,2) NOT NULL CHECK (amount > 0),
	payment_method payment_method NOT NULL,
	external_tx_id text,
	status escrow_tx_status NOT NULL DEFAULT 'pending',
	metadata jsonb DEFAULT '{}',
	created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE escrow_transactions IS 'Money movement records — hold, release, or refund tied to an order.';

CREATE INDEX idx_escrow_order ON escrow_transactions (order_id);


-- -------------------------------------------------------
-- Test reports
-- -------------------------------------------------------

CREATE TABLE test_reports (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
	tester_id uuid NOT NULL REFERENCES profiles(id),

	-- Platform-specific inspection results (JSONB — schema varies)
	--
	-- Mobile example:
	-- { "battery_timing": { "score": 8, "notes": "..." },
	--   "screen_condition": { "score": 9, "notes": "..." },
	--   "camera_performance": { "score": 7, "notes": "..." },
	--   "sensors": { "score": 9, "notes": "..." },
	--   "pta_status": "approved",
	--   "motherboard": { "score": 10, "notes": "..." } }
	--
	-- Automotive example:
	-- { "engine": { "score": 8, "notes": "..." },
	--   "transmission": { "score": 9, "notes": "..." },
	--   "brakes": { "score": 7, "notes": "..." },
	--   "suspension": { "score": 8, "notes": "..." },
	--   "body_exterior": { "score": 6, "notes": "Dent on rear bumper" },
	--   "electrical": { "score": 9, "notes": "..." },
	--   "ac_heater": { "score": 10, "notes": "..." } }
	inspection_results jsonb NOT NULL DEFAULT '{}',

	-- Overall verdict (platform-agnostic)
	overall_score smallint CHECK (overall_score BETWEEN 1 AND 10),
	overall_notes text,
	passed boolean,

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE test_reports IS 'Product inspection report from testing center. One per order. Criteria vary by platform.';
