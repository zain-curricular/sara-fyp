-- ============================================================================
-- ShopSmart Profile Extensions
-- ============================================================================
-- Adds multi-role support to the existing profiles table.
-- Preserves existing `role` column for backward compat with existing RLS.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT ARRAY['buyer'],
  ADD COLUMN IF NOT EXISTS active_role text NOT NULL DEFAULT 'buyer';

-- Sync existing single role into roles array
UPDATE profiles SET roles = ARRAY[role::text] WHERE roles = ARRAY['buyer'] AND role IS NOT NULL;
UPDATE profiles SET active_role = role::text WHERE role IS NOT NULL;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING gin(roles);
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles (active_role);
