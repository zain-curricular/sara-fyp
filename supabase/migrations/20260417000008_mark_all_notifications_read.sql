-- ============================================================================
-- Notifications — bulk mark-all-read RPC (exact affected count, no row payload)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
	WITH updated AS (
		UPDATE public.notifications n
		SET read_at = now()
		WHERE n.user_id = p_user_id
			AND n.read_at IS NULL
		RETURNING n.id
	)
	SELECT count(*)::integer FROM updated;
$$;

COMMENT ON FUNCTION public.mark_all_notifications_read(uuid) IS
	'Sets read_at on all unread notifications for a user; returns rows affected. Server-side only (service role).';

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) TO service_role;
