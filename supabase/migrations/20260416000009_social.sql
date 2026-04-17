-- ============================================================================
-- Social Features, Notifications & Subscriptions
-- ============================================================================
--
-- Favorites, browsing history, reviews, reports, notifications, and seller
-- subscription plans. All lightweight junction/event tables.
--


-- -------------------------------------------------------
-- Favorites
-- -------------------------------------------------------

CREATE TABLE favorites (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
	listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
	created_at timestamptz NOT NULL DEFAULT now(),

	UNIQUE (user_id, listing_id)
);

COMMENT ON TABLE favorites IS 'User-saved listings (wishlist).';

CREATE INDEX idx_favorites_user ON favorites (user_id, created_at DESC);


-- -------------------------------------------------------
-- Viewed listings (browsing history)
-- -------------------------------------------------------

CREATE TABLE viewed_listings (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
	listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
	viewed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE viewed_listings IS 'Browsing history for AI recommendations. Capped per user by trigger.';

CREATE INDEX idx_viewed_user ON viewed_listings (user_id, viewed_at DESC);
CREATE INDEX idx_viewed_listing ON viewed_listings (listing_id);


-- -------------------------------------------------------
-- Reviews
-- -------------------------------------------------------

CREATE TABLE reviews (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	reviewer_id uuid NOT NULL REFERENCES profiles(id),
	reviewed_user_id uuid NOT NULL REFERENCES profiles(id),
	order_id uuid NOT NULL REFERENCES orders(id),
	listing_id uuid NOT NULL REFERENCES listings(id),

	rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
	comment text,

	created_at timestamptz NOT NULL DEFAULT now(),

	-- One review per direction per order
	UNIQUE (reviewer_id, order_id)
);

COMMENT ON TABLE reviews IS 'Post-transaction reviews. One per user per order.';

CREATE INDEX idx_reviews_reviewed ON reviews (reviewed_user_id, created_at DESC);


-- -------------------------------------------------------
-- Reports (moderation)
-- -------------------------------------------------------

CREATE TABLE reports (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id),
	target_type report_target NOT NULL,
	target_id uuid NOT NULL,
	reason text NOT NULL,
	description text,
	status report_status NOT NULL DEFAULT 'pending',
	resolved_by uuid REFERENCES profiles(id),
	resolved_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE reports IS 'User-submitted reports on listings or other users.';

CREATE INDEX idx_reports_pending ON reports (status, created_at) WHERE status = 'pending';
CREATE INDEX idx_reports_target ON reports (target_type, target_id);


-- -------------------------------------------------------
-- Notifications
-- -------------------------------------------------------

CREATE TABLE notifications (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
	type notification_type NOT NULL,
	title text NOT NULL,
	body text,
	entity_type text,
	entity_id uuid,
	read_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'Server-generated notifications. Never created by client.';

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC)
	WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);


-- -------------------------------------------------------
-- Subscriptions (seller plans)
-- -------------------------------------------------------

CREATE TABLE subscriptions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL REFERENCES profiles(id),
	tier subscription_tier NOT NULL DEFAULT 'free',

	starts_at timestamptz NOT NULL DEFAULT now(),
	expires_at timestamptz,

	-- Plan limits
	max_active_listings integer NOT NULL DEFAULT 5,
	max_featured_listings integer NOT NULL DEFAULT 0,

	is_active boolean NOT NULL DEFAULT true,

	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE subscriptions IS 'Seller subscription plans — controls listing quotas.';

CREATE INDEX idx_subscriptions_user ON subscriptions (user_id) WHERE is_active = true;
