// ============================================================================
// Payout Setup Page
// ============================================================================
//
// RSC: loads current payout method config from profile metadata,
// renders PayoutSetupShell for editing.

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import PayoutSetupShell from "./shell";

export const metadata = { title: "Payout Setup — ShopSmart Seller" };

export type PayoutSettings = {
	method: "bank_transfer" | "jazzcash" | "easypaisa" | null;
	accountTitle: string;
	accountNumber: string;
	bankName: string;
};

export default async function PayoutSetupPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	// Read existing payout settings from profile metadata
	const { data: profile } = await supabase
		.from("profiles")
		.select("metadata")
		.eq("id", user.id)
		.maybeSingle();

	const meta = (profile as Record<string, unknown> | null)?.metadata as Record<string, unknown> | null;
	const payoutSettings: PayoutSettings = {
		method: (meta?.payout_method as PayoutSettings["method"]) ?? null,
		accountTitle: (meta?.payout_account_title as string) ?? "",
		accountNumber: (meta?.payout_account_number as string) ?? "",
		bankName: (meta?.payout_bank_name as string) ?? "",
	};

	return <PayoutSetupShell settings={payoutSettings} />;
}
