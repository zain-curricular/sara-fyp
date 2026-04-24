// ============================================================================
// Reset Password Page
// ============================================================================
//
// RSC that reads the `code` query param from the Supabase password-reset email
// link and passes it to the shell. The shell exchanges the code for a session
// then lets the user set a new password.

import type { Metadata } from "next";

import ResetPasswordShell from "./shell";

export const metadata: Metadata = {
	title: "Reset password — ShopSmart",
	description: "Set a new password for your ShopSmart account.",
};

interface ResetPasswordPageProps {
	searchParams: Promise<{ code?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
	const { code } = await searchParams;

	return <ResetPasswordShell code={code} />;
}
