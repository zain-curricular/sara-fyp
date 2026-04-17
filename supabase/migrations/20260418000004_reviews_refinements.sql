-- ============================================================================
-- Reviews refinements — self-review guard (schema already has UNIQUE + index)
-- ============================================================================

DO $$
BEGIN
	ALTER TABLE public.reviews
		ADD CONSTRAINT reviews_not_self_ck CHECK (reviewer_id <> reviewed_user_id);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;
