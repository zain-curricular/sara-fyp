-- ============================================================================
-- Profiles refinements
-- ============================================================================
--
-- Adds public handle, onboarding/activity fields, locale, and integrity checks
-- agreed in the Users & Profiles feature spec. Safe to apply after base profiles.
--

ALTER TABLE profiles
	ADD COLUMN handle text UNIQUE,
	ADD COLUMN onboarding_completed_at timestamptz,
	ADD COLUMN last_seen_at timestamptz,
	ADD COLUMN locale text NOT NULL DEFAULT 'en';

ALTER TABLE profiles
	ADD CONSTRAINT profiles_phone_e164
		CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9][0-9]{1,14}$'),
	ADD CONSTRAINT profiles_handle_format
		CHECK (handle IS NULL OR handle ~ '^[a-z0-9_]{3,30}$');

CREATE INDEX idx_profiles_handle ON profiles (handle) WHERE handle IS NOT NULL;
CREATE INDEX idx_profiles_last_seen ON profiles (last_seen_at DESC NULLS LAST);
