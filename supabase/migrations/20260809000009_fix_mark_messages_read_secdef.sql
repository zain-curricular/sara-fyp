-- ============================================================================
-- Fix: mark_messages_read must run SECURITY DEFINER
-- ============================================================================
--
-- Bug: opening a conversation marked the other party's messages as read, but the
-- reader's unread badge never cleared. Root cause is RLS, not app logic:
--
--   * `conversations` has only SELECT + INSERT RLS policies — there is NO UPDATE
--     policy. A participant therefore cannot UPDATE a conversation row directly.
--   * `mark_messages_read` ran as SECURITY INVOKER, so its
--     `UPDATE conversations SET unread_count_* = 0` was silently filtered to zero
--     rows by RLS (no error). The paired `UPDATE messages SET read_at` DID apply,
--     because `messages` has the `messages_update_read` policy — hence the
--     half-applied state (messages read, counter stuck).
--   * The increment side worked only because `handle_new_message` (the insert
--     trigger) is already SECURITY DEFINER and bypasses RLS.
--
-- Fix: recreate `mark_messages_read` as SECURITY DEFINER, mirroring
-- `handle_new_message`. The function already performs its own authorization
-- (NOT_AUTHENTICATED / CONVERSATION_NOT_FOUND / NOT_PARTICIPANT via auth.uid()),
-- so definer rights only let a verified participant reset their own side — no
-- new RLS surface is opened.

create or replace function public.mark_messages_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
	v_user_id uuid := auth.uid();
	v_conv public.conversations%ROWTYPE;
begin
	if v_user_id is null then
		raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
	end if;

	select * into v_conv from public.conversations where id = p_conversation_id;

	if v_conv is null then
		raise exception 'CONVERSATION_NOT_FOUND' using errcode = 'P0001';
	end if;

	if v_user_id not in (v_conv.buyer_id, v_conv.seller_id) then
		raise exception 'NOT_PARTICIPANT' using errcode = 'P0001';
	end if;

	update public.messages
	set read_at = now()
	where conversation_id = p_conversation_id
		and sender_id != v_user_id
		and read_at is null;

	if v_user_id = v_conv.buyer_id then
		update public.conversations set unread_count_buyer = 0, updated_at = now() where id = p_conversation_id;
	else
		update public.conversations set unread_count_seller = 0, updated_at = now() where id = p_conversation_id;
	end if;
end;
$function$;
