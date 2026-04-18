-- ============================================================================
-- Warranty claims — sellers can view claims on orders they sold
-- ============================================================================
-- Aligns RLS with product expectation: claimant, seller (via warranty), admin.

DROP POLICY IF EXISTS warranty_claims_select ON warranty_claims;

CREATE POLICY warranty_claims_select ON warranty_claims
	FOR SELECT USING (
		claimant_id = auth.uid()
		OR is_admin()
		OR EXISTS (
			SELECT 1 FROM warranties w
			WHERE w.id = warranty_id
			AND w.seller_id = auth.uid()
		)
	);
