-- ============================================================================
-- Row Level Security Policies
-- ============================================================================
--
-- Every table has RLS enabled. Default is deny-all — only explicit policies
-- grant access. The JWT's auth.uid() is the sole trust anchor.
--
-- Naming convention: {table}_{action}_{who}
--   e.g. listings_select_public, profiles_update_own
--


-- -------------------------------------------------------
-- Helper: check if current user has a specific role
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT EXISTS (
		SELECT 1 FROM public.profiles
		WHERE id = auth.uid() AND role = 'admin'
	);
$$;

CREATE OR REPLACE FUNCTION is_tester()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT EXISTS (
		SELECT 1 FROM public.profiles
		WHERE id = auth.uid() AND role = 'tester'
	);
$$;

CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT EXISTS (
		SELECT 1 FROM public.profiles
		WHERE id = auth.uid() AND role = required_role
	);
$$;


-- =========================================================
-- PRODUCT CATALOG (public read, admin write)
-- =========================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_select_public ON categories
	FOR SELECT USING (true);
CREATE POLICY categories_insert_admin ON categories
	FOR INSERT WITH CHECK (is_admin());
CREATE POLICY categories_update_admin ON categories
	FOR UPDATE USING (is_admin());
CREATE POLICY categories_delete_admin ON categories
	FOR DELETE USING (is_admin());

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY brands_select_public ON brands
	FOR SELECT USING (true);
CREATE POLICY brands_insert_admin ON brands
	FOR INSERT WITH CHECK (is_admin());
CREATE POLICY brands_update_admin ON brands
	FOR UPDATE USING (is_admin());
CREATE POLICY brands_delete_admin ON brands
	FOR DELETE USING (is_admin());

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY models_select_public ON models
	FOR SELECT USING (true);
CREATE POLICY models_insert_admin ON models
	FOR INSERT WITH CHECK (is_admin());
CREATE POLICY models_update_admin ON models
	FOR UPDATE USING (is_admin());
CREATE POLICY models_delete_admin ON models
	FOR DELETE USING (is_admin());

ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY specs_select_public ON specifications
	FOR SELECT USING (true);
CREATE POLICY specs_insert_admin ON specifications
	FOR INSERT WITH CHECK (is_admin());
CREATE POLICY specs_update_admin ON specifications
	FOR UPDATE USING (is_admin());
CREATE POLICY specs_delete_admin ON specifications
	FOR DELETE USING (is_admin());


-- =========================================================
-- PROFILES
-- =========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (marketplace needs seller info)
CREATE POLICY profiles_select_public ON profiles
	FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY profiles_update_own ON profiles
	FOR UPDATE USING (auth.uid() = id)
	WITH CHECK (auth.uid() = id);

-- Admins can update any profile (ban, role changes)
CREATE POLICY profiles_update_admin ON profiles
	FOR UPDATE USING (is_admin());

-- No client INSERT (handled by trigger) or DELETE


-- =========================================================
-- LISTINGS
-- =========================================================

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Public: see active listings. Owner: see all own listings
CREATE POLICY listings_select_public ON listings
	FOR SELECT USING (
		(status = 'active' AND deleted_at IS NULL)
		OR user_id = auth.uid()
		OR is_admin()
	);

-- Authenticated users can create listings (user_id forced via DEFAULT)
CREATE POLICY listings_insert_auth ON listings
	FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only owner can update their listing
CREATE POLICY listings_update_own ON listings
	FOR UPDATE USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());

-- Admin can update any listing (moderation)
CREATE POLICY listings_update_admin ON listings
	FOR UPDATE USING (is_admin());

-- Soft delete only — owner sets deleted_at
CREATE POLICY listings_delete_own ON listings
	FOR DELETE USING (user_id = auth.uid() AND status = 'draft');


-- =========================================================
-- LISTING IMAGES
-- =========================================================

ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- Public read (follows listing visibility)
CREATE POLICY listing_images_select_public ON listing_images
	FOR SELECT USING (true);

-- Insert only if you own the parent listing
CREATE POLICY listing_images_insert_owner ON listing_images
	FOR INSERT WITH CHECK (
		EXISTS (
			SELECT 1 FROM listings
			WHERE id = listing_id AND user_id = auth.uid()
		)
	);

-- Update (reorder) only if you own the parent listing
CREATE POLICY listing_images_update_owner ON listing_images
	FOR UPDATE USING (
		EXISTS (
			SELECT 1 FROM listings
			WHERE id = listing_id AND user_id = auth.uid()
		)
	);

-- Delete only if you own the parent listing
CREATE POLICY listing_images_delete_owner ON listing_images
	FOR DELETE USING (
		EXISTS (
			SELECT 1 FROM listings
			WHERE id = listing_id AND user_id = auth.uid()
		)
	);


-- =========================================================
-- AUCTION CONFIG
-- =========================================================

ALTER TABLE auction_config ENABLE ROW LEVEL SECURITY;

-- Public read (auction info shown on listing page)
CREATE POLICY auction_config_select_public ON auction_config
	FOR SELECT USING (true);

-- Insert only if you own the listing
CREATE POLICY auction_config_insert_owner ON auction_config
	FOR INSERT WITH CHECK (
		EXISTS (
			SELECT 1 FROM listings
			WHERE id = listing_id AND user_id = auth.uid()
		)
	);

-- Update only if you own the listing
CREATE POLICY auction_config_update_owner ON auction_config
	FOR UPDATE USING (
		EXISTS (
			SELECT 1 FROM listings
			WHERE id = listing_id AND user_id = auth.uid()
		)
	);


-- =========================================================
-- BIDS
-- =========================================================

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Public can see bids on a listing (bid history)
CREATE POLICY bids_select_public ON bids
	FOR SELECT USING (true);

-- Bids are created via place_bid() RPC — no direct INSERT
-- But we still need a policy for the function (SECURITY INVOKER)
CREATE POLICY bids_insert_auth ON bids
	FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- No UPDATE/DELETE from client


-- =========================================================
-- AUTO BIDS
-- =========================================================

ALTER TABLE auto_bids ENABLE ROW LEVEL SECURITY;

-- Only own auto-bids
CREATE POLICY auto_bids_select_own ON auto_bids
	FOR SELECT USING (user_id = auth.uid());

CREATE POLICY auto_bids_insert_own ON auto_bids
	FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY auto_bids_update_own ON auto_bids
	FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY auto_bids_delete_own ON auto_bids
	FOR DELETE USING (user_id = auth.uid());


-- =========================================================
-- ORDERS
-- =========================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Participants can see their orders
CREATE POLICY orders_select_participant ON orders
	FOR SELECT USING (
		buyer_id = auth.uid()
		OR seller_id = auth.uid()
		OR is_admin()
		OR is_tester()
	);

-- Orders created via system (buy now / auction win) — not direct client INSERT
-- But service functions run as SECURITY INVOKER
CREATE POLICY orders_insert_system ON orders
	FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Status transitions via DB function only. Admin can update.
CREATE POLICY orders_update_admin ON orders
	FOR UPDATE USING (is_admin());

-- Participants can update (limited fields — enforced by function)
CREATE POLICY orders_update_participant ON orders
	FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());


-- =========================================================
-- ESCROW TRANSACTIONS
-- =========================================================

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Participants + admin can view
CREATE POLICY escrow_select_participant ON escrow_transactions
	FOR SELECT USING (
		is_admin()
		OR EXISTS (
			SELECT 1 FROM orders
			WHERE orders.id = order_id
			AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
		)
	);

-- Insert only via Edge Function (service_role key) — no client policy needed
-- But add admin policy for manual corrections
CREATE POLICY escrow_insert_admin ON escrow_transactions
	FOR INSERT WITH CHECK (is_admin());


-- =========================================================
-- TEST REPORTS
-- =========================================================

ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;

-- Participants + tester + admin can view
CREATE POLICY test_reports_select ON test_reports
	FOR SELECT USING (
		is_admin()
		OR is_tester()
		OR EXISTS (
			SELECT 1 FROM orders
			WHERE orders.id = order_id
			AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
		)
	);

-- Only testers can create
CREATE POLICY test_reports_insert_tester ON test_reports
	FOR INSERT WITH CHECK (is_tester() AND tester_id = auth.uid());

-- Testers can update their own reports
CREATE POLICY test_reports_update_tester ON test_reports
	FOR UPDATE USING (tester_id = auth.uid() AND is_tester());

-- Admin can update any report
CREATE POLICY test_reports_update_admin ON test_reports
	FOR UPDATE USING (is_admin());


-- =========================================================
-- REPAIR CENTERS (admin only write, public read)
-- =========================================================

ALTER TABLE repair_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY repair_centers_select_public ON repair_centers
	FOR SELECT USING (true);
CREATE POLICY repair_centers_insert_admin ON repair_centers
	FOR INSERT WITH CHECK (is_admin());
CREATE POLICY repair_centers_update_admin ON repair_centers
	FOR UPDATE USING (is_admin());
CREATE POLICY repair_centers_delete_admin ON repair_centers
	FOR DELETE USING (is_admin());


-- =========================================================
-- WARRANTIES
-- =========================================================

ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;

-- Buyer, seller, admin can view
CREATE POLICY warranties_select ON warranties
	FOR SELECT USING (
		buyer_id = auth.uid()
		OR seller_id = auth.uid()
		OR is_admin()
	);

-- Created via trigger on order completion — no client INSERT
-- Admin can insert for manual cases
CREATE POLICY warranties_insert_admin ON warranties
	FOR INSERT WITH CHECK (is_admin());

CREATE POLICY warranties_update_admin ON warranties
	FOR UPDATE USING (is_admin());


-- =========================================================
-- WARRANTY CLAIMS
-- =========================================================

ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

-- Claimant + admin
CREATE POLICY warranty_claims_select ON warranty_claims
	FOR SELECT USING (
		claimant_id = auth.uid()
		OR is_admin()
	);

-- Only warranty buyer can file a claim
CREATE POLICY warranty_claims_insert_owner ON warranty_claims
	FOR INSERT WITH CHECK (
		auth.uid() = claimant_id
		AND EXISTS (
			SELECT 1 FROM warranties
			WHERE warranties.id = warranty_id
			AND warranties.buyer_id = auth.uid()
			AND warranties.status = 'active'
		)
	);

CREATE POLICY warranty_claims_update_admin ON warranty_claims
	FOR UPDATE USING (is_admin());


-- =========================================================
-- SPARE PARTS ORDERS
-- =========================================================

ALTER TABLE spare_parts_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY spare_parts_select_admin ON spare_parts_orders
	FOR SELECT USING (is_admin());
CREATE POLICY spare_parts_insert_admin ON spare_parts_orders
	FOR INSERT WITH CHECK (is_admin());
CREATE POLICY spare_parts_update_admin ON spare_parts_orders
	FOR UPDATE USING (is_admin());


-- =========================================================
-- CONVERSATIONS
-- =========================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Only participants
CREATE POLICY conversations_select_participant ON conversations
	FOR SELECT USING (
		buyer_id = auth.uid()
		OR seller_id = auth.uid()
	);

-- Buyer can start a conversation
CREATE POLICY conversations_insert_buyer ON conversations
	FOR INSERT WITH CHECK (buyer_id = auth.uid());


-- =========================================================
-- MESSAGES
-- =========================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Only conversation participants can read
CREATE POLICY messages_select_participant ON messages
	FOR SELECT USING (
		EXISTS (
			SELECT 1 FROM conversations
			WHERE conversations.id = conversation_id
			AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
		)
	);

-- Only participants can send, and sender must be themselves
CREATE POLICY messages_insert_participant ON messages
	FOR INSERT WITH CHECK (
		sender_id = auth.uid()
		AND EXISTS (
			SELECT 1 FROM conversations
			WHERE conversations.id = conversation_id
			AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
		)
	);

-- Mark as read (update read_at only)
CREATE POLICY messages_update_read ON messages
	FOR UPDATE USING (
		sender_id != auth.uid()
		AND EXISTS (
			SELECT 1 FROM conversations
			WHERE conversations.id = conversation_id
			AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
		)
	);


-- =========================================================
-- FAVORITES
-- =========================================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY favorites_select_own ON favorites
	FOR SELECT USING (user_id = auth.uid());
CREATE POLICY favorites_insert_own ON favorites
	FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY favorites_delete_own ON favorites
	FOR DELETE USING (user_id = auth.uid());


-- =========================================================
-- VIEWED LISTINGS
-- =========================================================

ALTER TABLE viewed_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY viewed_select_own ON viewed_listings
	FOR SELECT USING (user_id = auth.uid());
CREATE POLICY viewed_insert_own ON viewed_listings
	FOR INSERT WITH CHECK (user_id = auth.uid());


-- =========================================================
-- REVIEWS
-- =========================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY reviews_select_public ON reviews
	FOR SELECT USING (true);

-- Can only review after a completed order
CREATE POLICY reviews_insert_auth ON reviews
	FOR INSERT WITH CHECK (
		reviewer_id = auth.uid()
		AND EXISTS (
			SELECT 1 FROM orders
			WHERE orders.id = order_id
			AND orders.status = 'completed'
			AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
		)
	);


-- =========================================================
-- REPORTS
-- =========================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Own reports + admin sees all
CREATE POLICY reports_select ON reports
	FOR SELECT USING (reporter_id = auth.uid() OR is_admin());

CREATE POLICY reports_insert_auth ON reports
	FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY reports_update_admin ON reports
	FOR UPDATE USING (is_admin());


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Only own notifications
CREATE POLICY notifications_select_own ON notifications
	FOR SELECT USING (user_id = auth.uid());

-- Update read_at only
CREATE POLICY notifications_update_own ON notifications
	FOR UPDATE USING (user_id = auth.uid());

-- Insert via triggers/functions only — no client INSERT policy


-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Own + admin
CREATE POLICY subscriptions_select ON subscriptions
	FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY subscriptions_insert_admin ON subscriptions
	FOR INSERT WITH CHECK (is_admin());

CREATE POLICY subscriptions_update_admin ON subscriptions
	FOR UPDATE USING (is_admin());
