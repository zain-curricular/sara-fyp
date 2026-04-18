-- ============================================================================
-- Notifications — Realtime publication
-- ============================================================================
-- Clients subscribe with filter user_id=eq.<me>; RLS limits events to own rows.

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'notifications'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
	END IF;
END $$;
