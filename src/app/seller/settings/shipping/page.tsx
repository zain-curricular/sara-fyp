// ============================================================================
// Seller Shipping Settings Page
// ============================================================================
//
// RSC: loads existing shipping config from store metadata or seller_stores row.

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import ShippingSettingsShell from "./shell";

export const metadata = { title: "Shipping Settings — ShopSmart Seller" };

export type ShippingSettings = {
	flatFee: number;
	freeThreshold: number | null;
	cityRulesEnabled: boolean;
};

export default async function ShippingSettingsPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	// Load from seller_stores.metadata or profile metadata
	const { data: store } = await supabase
		.from("seller_stores")
		.select("metadata")
		.eq("owner_id", user.id)
		.maybeSingle();

	const meta = (store as Record<string, unknown> | null)?.metadata as Record<string, unknown> | null;

	const settings: ShippingSettings = {
		flatFee: (meta?.shipping_flat_fee as number) ?? 250,
		freeThreshold: (meta?.shipping_free_threshold as number | null) ?? null,
		cityRulesEnabled: (meta?.shipping_city_rules as boolean) ?? false,
	};

	return <ShippingSettingsShell settings={settings} />;
}
