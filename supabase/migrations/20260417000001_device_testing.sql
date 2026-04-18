-- ============================================================================
-- Device testing — assignment + inspection schema
-- ============================================================================

ALTER TABLE orders
	ADD COLUMN assigned_tester_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_assigned_tester ON orders (assigned_tester_id)
	WHERE assigned_tester_id IS NOT NULL;

COMMENT ON COLUMN orders.assigned_tester_id IS 'Tester assigned by admin for on-site device inspection.';

ALTER TABLE categories
	ADD COLUMN inspection_schema jsonb NOT NULL DEFAULT '{}';

COMMENT ON COLUMN categories.inspection_schema IS 'Inspection criteria: each key is a criterion; value maps sub-fields to type hints (number, string, boolean), validated like spec_schema.';

-- Refine tester policies: only the assigned tester may create/update reports for that order.
DROP POLICY IF EXISTS test_reports_insert_tester ON test_reports;
CREATE POLICY test_reports_insert_tester ON test_reports
	FOR INSERT WITH CHECK (
		is_tester()
		AND tester_id = auth.uid()
		AND EXISTS (
			SELECT 1 FROM orders
			WHERE orders.id = order_id
			AND orders.assigned_tester_id = auth.uid()
		)
	);

DROP POLICY IF EXISTS test_reports_update_tester ON test_reports;
CREATE POLICY test_reports_update_tester ON test_reports
	FOR UPDATE USING (
		tester_id = auth.uid()
		AND is_tester()
		AND EXISTS (
			SELECT 1 FROM orders
			WHERE orders.id = order_id
			AND orders.assigned_tester_id = auth.uid()
		)
	);
