import { redirect } from "next/navigation";

import { getPostSignInRedirectPath } from "@/lib/features/onboarding/post-sign-in-redirect";
import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** RSC entry after client sign-in/sign-up — loads profile on the server and redirects. */
export default async function ContinuePage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const emailVerified = Boolean(user?.email_confirmed_at);

	const profile = await fetchMyProfile();
	redirect(getPostSignInRedirectPath(profile, { emailVerified }));
}
