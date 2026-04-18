-- ============================================================================
-- Subscription escrow — atomic completion / failure (matches config.ts limits)
-- ============================================================================
--
-- Limits for premium / wholesale MUST stay aligned with:
--   src/lib/features/subscriptions/config.ts (SUBSCRIPTION_PLANS)
--

CREATE OR REPLACE FUNCTION public.complete_subscription_escrow(
	p_escrow_id uuid,
	p_external_tx_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
	v_escrow public.escrow_transactions%ROWTYPE;
	v_user_id uuid;
	v_tier_text text;
	v_tier public.subscription_tier;
	v_max_active integer;
	v_max_featured integer;
	v_expires timestamptz;
	v_sub public.subscriptions%ROWTYPE;
BEGIN
	SELECT * INTO v_escrow FROM public.escrow_transactions WHERE id = p_escrow_id FOR UPDATE;

	IF NOT FOUND THEN
		RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
	END IF;

	IF v_escrow.status IS DISTINCT FROM 'pending'::public.escrow_tx_status THEN
		IF v_escrow.status = 'completed'::public.escrow_tx_status THEN
			RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_COMPLETED');
		END IF;
		RETURN jsonb_build_object('ok', false, 'error', 'INVALID_STATE');
	END IF;

	IF v_escrow.metadata IS NULL OR v_escrow.metadata->>'kind' IS DISTINCT FROM 'subscription' THEN
		RETURN jsonb_build_object('ok', false, 'error', 'NOT_SUBSCRIPTION_INTENT');
	END IF;

	BEGIN
		v_user_id := (v_escrow.metadata->>'user_id')::uuid;
	EXCEPTION
		WHEN invalid_text_representation THEN
			RETURN jsonb_build_object('ok', false, 'error', 'NOT_SUBSCRIPTION_INTENT');
	END;

	v_tier_text := v_escrow.metadata->>'target_tier';
	IF v_tier_text IS NULL OR v_tier_text NOT IN ('premium', 'wholesale') THEN
		RETURN jsonb_build_object('ok', false, 'error', 'UNKNOWN_TIER');
	END IF;

	v_tier := v_tier_text::public.subscription_tier;

	-- Mirror SUBSCRIPTION_PLANS in config.ts
	v_max_active := CASE v_tier
		WHEN 'premium'::public.subscription_tier THEN 20
		WHEN 'wholesale'::public.subscription_tier THEN 100
		ELSE 5
	END;
	v_max_featured := CASE v_tier
		WHEN 'premium'::public.subscription_tier THEN 2
		WHEN 'wholesale'::public.subscription_tier THEN 10
		ELSE 0
	END;

	v_expires := now() + interval '30 days';

	UPDATE public.subscriptions
	SET is_active = false, updated_at = now()
	WHERE user_id = v_user_id AND is_active = true;

	INSERT INTO public.subscriptions (
		user_id,
		tier,
		starts_at,
		expires_at,
		max_active_listings,
		max_featured_listings,
		is_active
	)
	VALUES (
		v_user_id,
		v_tier,
		now(),
		v_expires,
		v_max_active,
		v_max_featured,
		true
	)
	RETURNING * INTO v_sub;

	UPDATE public.escrow_transactions
	SET
		status = 'completed'::public.escrow_tx_status,
		external_tx_id = COALESCE(p_external_tx_id, external_tx_id)
	WHERE id = p_escrow_id;

	RETURN jsonb_build_object('ok', true, 'subscription', to_jsonb(v_sub));
END;
$$;

COMMENT ON FUNCTION public.complete_subscription_escrow IS
	'Atomically completes a subscription escrow hold and inserts the active plan row.';

CREATE OR REPLACE FUNCTION public.fail_subscription_escrow(p_escrow_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
	v_escrow public.escrow_transactions%ROWTYPE;
BEGIN
	SELECT * INTO v_escrow FROM public.escrow_transactions WHERE id = p_escrow_id FOR UPDATE;

	IF NOT FOUND THEN
		RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
	END IF;

	IF v_escrow.metadata IS NULL OR v_escrow.metadata->>'kind' IS DISTINCT FROM 'subscription' THEN
		RETURN jsonb_build_object('ok', false, 'error', 'NOT_SUBSCRIPTION_INTENT');
	END IF;

	IF v_escrow.status IS DISTINCT FROM 'pending'::public.escrow_tx_status THEN
		IF v_escrow.status = 'failed'::public.escrow_tx_status THEN
			RETURN jsonb_build_object('ok', true, 'already_failed', true);
		END IF;
		RETURN jsonb_build_object('ok', false, 'error', 'INVALID_STATE');
	END IF;

	UPDATE public.escrow_transactions
	SET status = 'failed'::public.escrow_tx_status
	WHERE id = p_escrow_id;

	RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION public.fail_subscription_escrow IS
	'Marks a pending subscription escrow row as failed (idempotent if already failed).';

REVOKE ALL ON FUNCTION public.complete_subscription_escrow(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_subscription_escrow(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.complete_subscription_escrow(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_subscription_escrow(uuid) TO service_role;
