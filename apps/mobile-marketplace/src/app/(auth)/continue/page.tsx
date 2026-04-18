import { redirect } from "next/navigation";

import { getPostSignInRedirectPath } from "@/lib/features/onboarding/post-sign-in-redirect";
import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";

/** RSC entry after client sign-in/sign-up — loads profile on the server and redirects. */
export default async function ContinuePage() {
	const profile = await fetchMyProfile();
	redirect(getPostSignInRedirectPath(profile));
}
