// ============================================================================
// Logout Page
// ============================================================================
//
// Server component that signs the user out and redirects to /. Handles GET
// /logout requests — useful for links, bookmarks, and HTML anchor tags that
// can't issue a POST. For programmatic logout prefer POST /api/auth/logout.

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LogoutPage() {
	const supabase = await createServerSupabaseClient();
	await supabase.auth.signOut();
	redirect("/");
}
