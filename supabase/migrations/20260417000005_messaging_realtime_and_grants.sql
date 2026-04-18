-- ============================================================================
-- Messaging — Realtime publication + RPC grants
-- ============================================================================
-- Clients subscribe with Supabase Realtime; RLS filters events to participants.

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'messages'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
	END IF;
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'conversations'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
	END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;
