-- ============================================================================
-- Marketplace Gates — ShopSmart ship-ready Phase 2
-- ============================================================================
--
-- The three trust gates the proposal promises, plus the columns/enum members
-- the gate code needs:
--   * seller_stores.approval_status  — pending -> approved/rejected (admin gate).
--   * seller_stores.payout_details   — validated bank/wallet details, required
--                                      before a seller can publish.
--   * listing_status 'rejected' + listings.rejection_reason — so admin moderation
--     can reject with a reason (rejectListing already writes these; the enum
--     member and column were missing).
--   * notification_type seller_approved / seller_rejected.
--
-- Additive only. Decisions: INDEX §8.6 (payout_details jsonb), §8.7 (moderation on).


-- ---- 2.1 Seller approval status --------------------------------------------
alter table public.seller_stores
	add column if not exists approval_status text not null default 'pending'
	check (approval_status in ('pending', 'approved', 'rejected'));


-- ---- 2.2 Payout details ----------------------------------------------------
alter table public.seller_stores
	add column if not exists payout_details jsonb;


-- ---- 2.3 Listing rejection support -----------------------------------------
alter type public.listing_status add value if not exists 'rejected';

alter table public.listings
	add column if not exists rejection_reason text;


-- ---- Seller-approval notifications -----------------------------------------
alter type public.notification_type add value if not exists 'seller_approved';
alter type public.notification_type add value if not exists 'seller_rejected';
