// ============================================================================
// Sign-Up Redirect
// ============================================================================
//
// Thin redirect to /login?tab=signup. Kept for backwards compatibility with
// bookmarks, emails, and external links that reference the old /sign-up URL.

import { redirect } from "next/navigation";

/** @deprecated Redirects to /login?tab=signup. */
export default function SignUpPage() {
	redirect("/login?tab=signup");
}
