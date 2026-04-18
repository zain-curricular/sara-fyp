-- ============================================================================
-- Subscriptions — one active row per user + subscription checkout on escrow
-- ============================================================================

-- One active subscription per seller (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_user
	ON public.subscriptions (user_id)
	WHERE is_active = true;

-- Subscription payments: no order row; metadata.kind = 'subscription'.
ALTER TABLE public.escrow_transactions
	ALTER COLUMN order_id DROP NOT NULL;

ALTER TABLE public.escrow_transactions
	ADD CONSTRAINT escrow_order_or_subscription_chk CHECK (
		order_id IS NOT NULL
		OR (
			metadata IS NOT NULL
			AND (metadata->>'kind') = 'subscription'
			AND (metadata ? 'user_id')
			AND (metadata ? 'target_tier')
		)
	);

COMMENT ON COLUMN public.escrow_transactions.order_id IS
	'Set NULL for subscription checkout rows; see metadata.kind.';
