-- ============================================================================
-- Disputes — Align Table With Application Domain Model
-- ============================================================================
--
-- The `disputes` table was created by 20260419000007_shopsmart_orders.sql with a
-- narrow vocabulary that the application layer has since outgrown:
--
--   * `seller_reply` / `seller_replied_at` are read by
--     lib/features/disputes/services.ts and lib/features/admin/services.ts but
--     never existed as columns — every buyer/seller/admin dispute query failed
--     with `42703 column disputes.seller_reply does not exist`.
--   * `reason` allowed only the legacy set (not_received/damaged/counterfeit/…)
--     while the API validates against the richer DisputeReason union, so
--     `POST /api/disputes` violated the CHECK constraint.
--   * `status` allowed 'reviewing' but the UI and admin filters use
--     'under_review', plus 'resolved'/'closed' for the buyer & seller surfaces.
--
-- This migration adds the missing columns, normalises existing rows onto the
-- application vocabulary, and widens both CHECK constraints to the full set the
-- code can produce.


-- ----------------------------------------------------------------------------
-- 1 — Seller reply columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.disputes
	ADD COLUMN IF NOT EXISTS seller_reply      text,
	ADD COLUMN IF NOT EXISTS seller_replied_at timestamptz;

COMMENT ON COLUMN public.disputes.seller_reply IS
	'Seller''s written response to the dispute; shown to the buyer and admin.';

COMMENT ON COLUMN public.disputes.seller_replied_at IS
	'Timestamp of the seller''s response. Null until the seller replies.';


-- ----------------------------------------------------------------------------
-- 2 — Normalise legacy reason values
-- ----------------------------------------------------------------------------
--
-- Drop the constraint first so the UPDATE cannot trip the old CHECK.

ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_reason_check;

UPDATE public.disputes
SET reason = CASE reason
	WHEN 'not_received' THEN 'item_not_received'
	WHEN 'damaged'      THEN 'damaged_item'
	WHEN 'counterfeit'  THEN 'item_not_as_described'
	ELSE reason
END
WHERE reason IN ('not_received', 'damaged', 'counterfeit');

ALTER TABLE public.disputes
	ADD CONSTRAINT disputes_reason_check CHECK (reason IN (
		'item_not_received',
		'item_not_as_described',
		'damaged_item',
		'wrong_item',
		'seller_unresponsive',
		'other'
	));


-- ----------------------------------------------------------------------------
-- 3 — Normalise legacy status values
-- ----------------------------------------------------------------------------
--
-- 'resolved_buyer' / 'resolved_seller' are written by the admin resolve route
-- and are kept as-is; 'reviewing' folds into the UI's 'under_review'.

ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_status_check;

UPDATE public.disputes
SET status = 'under_review'
WHERE status = 'reviewing';

ALTER TABLE public.disputes
	ADD CONSTRAINT disputes_status_check CHECK (status IN (
		'open',
		'under_review',
		'resolved_buyer',
		'resolved_seller',
		'resolved',
		'closed',
		'cancelled'
	));


-- ----------------------------------------------------------------------------
-- 4 — Rebuild the open-dispute partial index
-- ----------------------------------------------------------------------------
--
-- The original index was predicated on the now-removed 'reviewing' value, which
-- made it useless for the admin queue query (status in open/under_review).

DROP INDEX IF EXISTS public.idx_disputes_status;

CREATE INDEX IF NOT EXISTS idx_disputes_status
	ON public.disputes (status)
	WHERE status IN ('open', 'under_review');
