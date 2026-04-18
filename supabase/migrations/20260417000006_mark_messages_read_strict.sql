-- ============================================================================
-- mark_messages_read — fail loudly (no silent no-ops)
-- ============================================================================
-- Aligns RPC with API expectations: unknown conversation / non-participant
-- surface as errors instead of returning void.

CREATE OR REPLACE FUNCTION public.mark_messages_read(
	p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
	v_user_id uuid := auth.uid();
	v_conv public.conversations%ROWTYPE;
BEGIN
	IF v_user_id IS NULL THEN
		RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
	END IF;

	SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation_id;

	IF v_conv IS NULL THEN
		RAISE EXCEPTION 'CONVERSATION_NOT_FOUND' USING ERRCODE = 'P0001';
	END IF;

	IF v_user_id NOT IN (v_conv.buyer_id, v_conv.seller_id) THEN
		RAISE EXCEPTION 'NOT_PARTICIPANT' USING ERRCODE = 'P0001';
	END IF;

	UPDATE public.messages
	SET read_at = now()
	WHERE conversation_id = p_conversation_id
		AND sender_id != v_user_id
		AND read_at IS NULL;

	IF v_user_id = v_conv.buyer_id THEN
		UPDATE public.conversations SET unread_count_buyer = 0, updated_at = now() WHERE id = p_conversation_id;
	ELSE
		UPDATE public.conversations SET unread_count_seller = 0, updated_at = now() WHERE id = p_conversation_id;
	END IF;
END;
$$;
