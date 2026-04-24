// ============================================================================
// Login Page
// ============================================================================
//
// Unified login/sign-up page. Replaces the old /sign-in and /sign-up routes.
// RSC: reads ?next= from searchParams, passes through to shell for post-auth
// redirect. No auth check here — the shell handles everything client-side.

import type { Metadata } from "next";

import LoginShell from "./shell";

export const metadata: Metadata = {
	title: "Sign in — ShopSmart",
	description: "Sign in or create your ShopSmart account.",
};

interface LoginPageProps {
	searchParams: Promise<{ next?: string; tab?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const { next, tab } = await searchParams;

	return <LoginShell defaultTab={tab === "signup" ? "signup" : "login"} next={next} />;
}
