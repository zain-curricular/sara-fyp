-- ============================================================================
-- Append-only admin audit log (moderation + future admin actions)
-- ============================================================================

CREATE TABLE admin_audit_logs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
	action text NOT NULL,
	target_type text NOT NULL,
	target_id uuid,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE admin_audit_logs IS 'Append-only admin action log. No UPDATE/DELETE policies.';

CREATE INDEX idx_admin_audit_actor_created ON admin_audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_admin_audit_target ON admin_audit_logs (target_type, target_id);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_audit_logs_select ON admin_audit_logs
	FOR SELECT USING (is_admin());

CREATE POLICY admin_audit_logs_insert ON admin_audit_logs
	FOR INSERT WITH CHECK (is_admin() AND actor_id = auth.uid());
