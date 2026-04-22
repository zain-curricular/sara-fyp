-- ============================================================================
-- Atomic admin resolve: update report + append audit log (single transaction)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_resolve_report_atomic(
	p_report_id uuid,
	p_new_status public.report_status,
	p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	v_prev public.report_status;
	v_row jsonb;
BEGIN
	IF p_new_status NOT IN ('reviewed', 'resolved', 'dismissed') THEN
		RAISE EXCEPTION 'INVALID_RESOLVE_STATUS' USING ERRCODE = 'P0001';
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM public.profiles WHERE id = p_actor_id AND role = 'admin'
	) THEN
		RAISE EXCEPTION 'ACTOR_NOT_ADMIN' USING ERRCODE = 'P0001';
	END IF;

	SELECT status INTO v_prev FROM public.reports WHERE id = p_report_id FOR UPDATE;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'REPORT_NOT_FOUND' USING ERRCODE = 'P0001';
	END IF;

	UPDATE public.reports r
	SET status = p_new_status,
		resolved_by = p_actor_id,
		resolved_at = now()
	WHERE r.id = p_report_id
	RETURNING row_to_json(r)::jsonb INTO v_row;

	IF v_row IS NULL THEN
		RAISE EXCEPTION 'REPORT_NOT_FOUND' USING ERRCODE = 'P0001';
	END IF;

	INSERT INTO public.admin_audit_logs (actor_id, action, target_type, target_id, metadata)
	VALUES (
		p_actor_id,
		'resolve_report',
		'report',
		p_report_id,
		jsonb_build_object(
			'previous_status', v_prev::text,
			'new_status', p_new_status::text
		)
	);

	RETURN v_row;
END;
$$;
