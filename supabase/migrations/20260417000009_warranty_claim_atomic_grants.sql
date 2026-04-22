-- ============================================================================
-- Grants & docs: create_warranty_claim_atomic
-- ============================================================================
--
-- Supabase CLI applies migrations using prepared statements; keep this migration
-- to a single SQL statement.

DO $$
BEGIN
	REVOKE ALL ON FUNCTION public.create_warranty_claim_atomic(uuid, uuid, text) FROM PUBLIC;
	GRANT EXECUTE ON FUNCTION public.create_warranty_claim_atomic(uuid, uuid, text) TO service_role;

	COMMENT ON FUNCTION public.create_warranty_claim_atomic IS
		'Creates a claim and sets warranty to claimed in one transaction; service_role only.';
END
$$;
