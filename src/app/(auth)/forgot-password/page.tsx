// ============================================================================
// Forgot Password Page
// ============================================================================
//
// RSC wrapper for the forgot-password flow. No server-side data needed —
// just renders the shell which handles the form submission client-side.

import type { Metadata } from "next";

import ForgotPasswordShell from "./shell";

export const metadata: Metadata = {
	title: "Forgot password — ShopSmart",
	description: "Reset your ShopSmart account password.",
};

export default function ForgotPasswordPage() {
	return <ForgotPasswordShell />;
}
