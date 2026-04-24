// ============================================================================
// Sign-In Redirect
// ============================================================================
//
// Thin redirect to /login. Kept for backwards compatibility with bookmarks,
// emails, and external links that reference the old /sign-in URL.

import { redirect } from "next/navigation";

/** @deprecated Redirects to /login. */
export default function SignInPage() {
	redirect("/login");
}
