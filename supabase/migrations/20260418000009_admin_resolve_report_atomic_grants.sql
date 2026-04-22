-- ============================================================================
-- Grants & docs: admin_resolve_report_atomic
-- ============================================================================
--
-- Supabase CLI applies migrations using prepared statements; keep this migration
-- to a single SQL statement.

DO $$
BEGIN
	REVOKE ALL ON FUNCTION public.admin_resolve_report_atomic(uuid, public.report_status, uuid) FROM PUBLIC;
	GRANT EXECUTE ON FUNCTION public.admin_resolve_report_atomic(uuid, public.report_status, uuid) TO service_role;

	COMMENT ON FUNCTION public.admin_resolve_report_atomic IS
		'Updates a moderation report and inserts an audit row in one transaction; service_role only.';
END
$$;
