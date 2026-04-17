-- ============================================================================
-- Enums
-- ============================================================================
--
-- All custom enum types used across the marketplace. Created first so every
-- subsequent migration can reference them without forward-dependency issues.
--


-- Platforms (shared backend serves multiple frontends)
CREATE TYPE platform_type AS ENUM ('mobile', 'automotive');

-- User & access
CREATE TYPE user_role AS ENUM ('user', 'seller', 'tester', 'admin');

-- Listings
CREATE TYPE listing_status AS ENUM (
	'draft',
	'pending_review',
	'active',
	'sold',
	'expired',
	'removed',
	'flagged'
);

CREATE TYPE sale_type AS ENUM ('fixed', 'auction', 'both');

CREATE TYPE item_condition AS ENUM (
	'new',
	'like_new',
	'excellent',
	'good',
	'fair',
	'poor'
);

-- Auctions
CREATE TYPE bid_status AS ENUM ('active', 'outbid', 'won', 'lost', 'cancelled');

-- Orders & escrow
CREATE TYPE order_status AS ENUM (
	'awaiting_payment',
	'payment_received',
	'shipped_to_center',
	'under_testing',
	'testing_complete',
	'approved',
	'rejected',
	'shipped_to_buyer',
	'delivered',
	'completed',
	'cancelled',
	'refunded'
);

CREATE TYPE escrow_tx_type AS ENUM ('hold', 'release', 'refund');

CREATE TYPE escrow_tx_status AS ENUM ('pending', 'completed', 'failed');

CREATE TYPE payment_method AS ENUM (
	'jazzcash',
	'easypaisa',
	'stripe',
	'bank_transfer'
);

-- Warranty
CREATE TYPE warranty_status AS ENUM ('active', 'expired', 'claimed');

CREATE TYPE claim_status AS ENUM (
	'submitted',
	'under_review',
	'approved',
	'rejected',
	'in_repair',
	'resolved'
);

CREATE TYPE spare_part_status AS ENUM ('ordered', 'received', 'installed');

-- Social / moderation
CREATE TYPE report_target AS ENUM ('listing', 'user');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Notifications
CREATE TYPE notification_type AS ENUM (
	'new_message',
	'outbid',
	'auction_ending',
	'auction_won',
	'auction_sold',
	'order_status',
	'price_drop',
	'warranty_expiring',
	'review_received',
	'listing_approved',
	'listing_flagged'
);

-- Subscriptions
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'wholesale');
