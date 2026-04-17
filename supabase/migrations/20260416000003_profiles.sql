-- ============================================================================
-- Profiles
-- ============================================================================
--
-- Extends auth.users with marketplace-specific data. Every Supabase Auth
-- signup automatically creates a profile row via the handle_new_user trigger.
--
-- No separate "buyer" vs "seller" table — any user can do both. The `role`
-- column gates admin/tester capabilities, not buying/selling.
--


CREATE TABLE profiles (
	id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	role user_role NOT NULL DEFAULT 'user',

	-- Identity
	display_name text,
	avatar_url text,
	phone_number text,
	phone_verified boolean NOT NULL DEFAULT false,
	email text,

	-- Location
	city text,
	area text,

	-- About
	bio text,

	-- Trust
	is_verified boolean NOT NULL DEFAULT false,
	is_banned boolean NOT NULL DEFAULT false,

	-- Aggregates (maintained by triggers)
	avg_rating numeric(3,2) NOT NULL DEFAULT 0,
	total_reviews integer NOT NULL DEFAULT 0,
	total_listings integer NOT NULL DEFAULT 0,
	total_sales integer NOT NULL DEFAULT 0,

	-- Timestamps
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Public marketplace profile for every authenticated user.';

CREATE INDEX idx_profiles_city ON profiles (city);
CREATE INDEX idx_profiles_role ON profiles (role);


-- -------------------------------------------------------
-- Auto-create profile on signup
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
	INSERT INTO public.profiles (id, email, display_name)
	VALUES (
		new.id,
		new.email,
		COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
	);
	RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
	AFTER INSERT ON auth.users
	FOR EACH ROW
	EXECUTE FUNCTION handle_new_user();
