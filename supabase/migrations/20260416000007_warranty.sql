-- ============================================================================
-- Warranty & After-Sales
-- ============================================================================
--
-- Warranties are auto-created when an order reaches COMPLETED status (via
-- trigger). Buyers can file claims; admins route them to repair centers.
--
-- repair_centers is admin-managed master data.
-- spare_parts_orders tracks parts needed during repairs.
--


-- -------------------------------------------------------
-- Repair centers (admin-managed)
-- -------------------------------------------------------

CREATE TABLE repair_centers (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL,
	address text NOT NULL,
	city text NOT NULL,
	phone_number text,
	email text,
	capabilities jsonb DEFAULT '[]',
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE repair_centers IS 'Physical repair/testing centers. Admin-managed.';


-- -------------------------------------------------------
-- Warranties
-- -------------------------------------------------------

CREATE TABLE warranties (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
	listing_id uuid NOT NULL REFERENCES listings(id),
	buyer_id uuid NOT NULL REFERENCES profiles(id),
	seller_id uuid NOT NULL REFERENCES profiles(id),

	starts_at timestamptz NOT NULL,
	expires_at timestamptz NOT NULL,
	status warranty_status NOT NULL DEFAULT 'active',

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),

	CONSTRAINT valid_warranty_window CHECK (expires_at > starts_at)
);

COMMENT ON TABLE warranties IS '6-month warranty auto-created on order completion.';

CREATE INDEX idx_warranties_buyer ON warranties (buyer_id, status);
CREATE INDEX idx_warranties_expiry ON warranties (expires_at) WHERE status = 'active';


-- -------------------------------------------------------
-- Warranty claims
-- -------------------------------------------------------

CREATE TABLE warranty_claims (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	warranty_id uuid NOT NULL REFERENCES warranties(id),
	claimant_id uuid NOT NULL REFERENCES profiles(id),

	issue_description text NOT NULL,
	photos jsonb DEFAULT '[]',

	status claim_status NOT NULL DEFAULT 'submitted',
	assigned_repair_center_id uuid REFERENCES repair_centers(id),
	resolution_notes text,

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE warranty_claims IS 'Buyer-submitted warranty claims. Admin processes and routes to repair centers.';

CREATE INDEX idx_warranty_claims_status ON warranty_claims (status) WHERE status NOT IN ('resolved', 'rejected');


-- -------------------------------------------------------
-- Spare parts orders
-- -------------------------------------------------------

CREATE TABLE spare_parts_orders (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	claim_id uuid NOT NULL REFERENCES warranty_claims(id),
	part_name text NOT NULL,
	quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
	cost numeric(10,2),
	status spare_part_status NOT NULL DEFAULT 'ordered',
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE spare_parts_orders IS 'Parts ordered for warranty repairs. Linked to a specific claim.';
