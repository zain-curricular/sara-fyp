-- ============================================================================
-- Reviews — Seller Reply Columns & Update Policy
-- ============================================================================
--
-- The seller reviews surface (`/seller/reviews`) and `POST /api/reviews/[id]/reply`
-- both read and write `seller_reply` / `seller_replied_at`, but neither column
-- ever existed on `public.reviews`:
--
--   * app/seller/reviews/page.tsx selects them, so every page load failed with
--     `42703 column reviews.seller_reply does not exist`.
--   * app/api/reviews/[id]/reply/route.ts updates them.
--
-- `reviews` also carried only SELECT and INSERT policies, so even with the
-- columns present the reply UPDATE would have matched zero rows under RLS and
-- reported success without persisting anything.
--
-- This migration adds both columns and the seller-scoped UPDATE policy.


-- ----------------------------------------------------------------------------
-- 1 — Seller reply columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.reviews
	ADD COLUMN IF NOT EXISTS seller_reply      text,
	ADD COLUMN IF NOT EXISTS seller_replied_at timestamptz;

COMMENT ON COLUMN public.reviews.seller_reply IS
	'Seller''s public response to the review; shown beneath the review.';

COMMENT ON COLUMN public.reviews.seller_replied_at IS
	'Timestamp of the seller''s response. Null until the seller replies.';


-- ----------------------------------------------------------------------------
-- 2 — Reply length guard
-- ----------------------------------------------------------------------------
--
-- Mirrors the 1000-character ceiling enforced by the route's Zod schema.

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_seller_reply_len_ck;

ALTER TABLE public.reviews
	ADD CONSTRAINT reviews_seller_reply_len_ck
	CHECK (seller_reply IS NULL OR "char_length"(seller_reply) BETWEEN 1 AND 1000);


-- ----------------------------------------------------------------------------
-- 3 — Seller-scoped UPDATE policy
-- ----------------------------------------------------------------------------
--
-- Only the reviewed user (the seller) may update their own review row, and the
-- USING/WITH CHECK pair prevents re-assigning the row to another user.

DROP POLICY IF EXISTS "reviews_update_seller_reply" ON public.reviews;

CREATE POLICY "reviews_update_seller_reply" ON public.reviews
	FOR UPDATE
	USING (reviewed_user_id = auth.uid())
	WITH CHECK (reviewed_user_id = auth.uid());
