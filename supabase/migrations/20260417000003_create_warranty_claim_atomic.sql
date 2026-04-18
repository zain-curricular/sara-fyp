-- ============================================================================
-- Atomic create: warranty claim + warranty.status = claimed (single transaction)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_warranty_claim_atomic(
	p_warranty_id uuid,
	p_claimant_id uuid,
	p_issue_description text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	v_claim_id uuid;
	v_exists boolean;
BEGIN
	SELECT EXISTS (SELECT 1 FROM public.warranties WHERE id = p_warranty_id) INTO v_exists;
	IF NOT v_exists THEN
		RAISE EXCEPTION 'WARRANTY_NOT_FOUND' USING ERRCODE = 'P0001';
	END IF;

	INSERT INTO public.warranty_claims (warranty_id, claimant_id, issue_description, photos)
	SELECT w.id, p_claimant_id, p_issue_description, '[]'::jsonb
	FROM public.warranties w
	WHERE w.id = p_warranty_id
		AND w.buyer_id = p_claimant_id
		AND w.status = 'active'
		AND w.expires_at > now()
	RETURNING id INTO v_claim_id;

	IF v_claim_id IS NULL THEN
		RAISE EXCEPTION 'WARRANTY_NOT_CLAIMABLE' USING ERRCODE = 'P0001';
	END IF;

	UPDATE public.warranties
	SET status = 'claimed', updated_at = now()
	WHERE id = p_warranty_id;

	RETURN v_claim_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_warranty_claim_atomic(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_warranty_claim_atomic(uuid, uuid, text) TO service_role;

COMMENT ON FUNCTION public.create_warranty_claim_atomic IS
	'Creates a claim and sets warranty to claimed in one transaction; service_role only.';
