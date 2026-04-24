// ============================================================================
// Addresses — Server Services
// ============================================================================
//
// Server-only CRUD functions for saved addresses. All functions return
// { data, error } and never throw. isDefault enforcement: when creating or
// setting a default, all other addresses for the user are unset first.
//
// Table: saved_addresses (id, user_id, label, full_name, phone, address_line,
//   city, province, is_default, created_at)

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { SavedAddress } from "./types";
import type { AddressInput } from "./schemas";

// ----------------------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------------------

function mapRow(row: Record<string, unknown>): SavedAddress {
	return {
		id: row.id as string,
		userId: row.user_id as string,
		label: row.label as string,
		fullName: row.full_name as string,
		phone: row.phone as string,
		addressLine: row.address_line as string,
		city: row.city as string,
		province: row.province as string,
		isDefault: row.is_default as boolean,
		createdAt: row.created_at as string,
	};
}

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------

/** List all saved addresses for a user, default first. */
export async function listAddresses(
	userId: string,
): Promise<{ data: SavedAddress[]; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("saved_addresses")
		.select("*")
		.eq("user_id", userId)
		.order("is_default", { ascending: false })
		.order("created_at", { ascending: true });

	if (error) return { data: [], error };

	return {
		data: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
		error: null,
	};
}

/** Create a new address. If isDefault, unsets all others first. */
export async function createAddress(
	userId: string,
	input: AddressInput,
): Promise<{ data: SavedAddress | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Unset existing defaults if this one is default
	if (input.isDefault) {
		const { error: unsetError } = await supabase
			.from("saved_addresses")
			.update({ is_default: false })
			.eq("user_id", userId);

		if (unsetError) return { data: null, error: unsetError };
	}

	const { data, error } = await supabase
		.from("saved_addresses")
		.insert({
			user_id: userId,
			label: input.label,
			full_name: input.fullName,
			phone: input.phone,
			address_line: input.addressLine,
			city: input.city,
			province: input.province,
			is_default: input.isDefault,
		})
		.select("*")
		.single();

	if (error) return { data: null, error };

	return { data: mapRow(data as Record<string, unknown>), error: null };
}

/** Update an existing address (must belong to userId). If isDefault, unsets others. */
export async function updateAddress(
	userId: string,
	addressId: string,
	input: AddressInput,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Verify ownership
	const { data: existing, error: fetchError } = await supabase
		.from("saved_addresses")
		.select("id, user_id")
		.eq("id", addressId)
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!existing) return { error: new Error("Address not found") };
	if ((existing as Record<string, unknown>).user_id !== userId) {
		return { error: new Error("Forbidden") };
	}

	// Unset other defaults if needed
	if (input.isDefault) {
		const { error: unsetError } = await supabase
			.from("saved_addresses")
			.update({ is_default: false })
			.eq("user_id", userId)
			.neq("id", addressId);

		if (unsetError) return { error: unsetError };
	}

	const { error } = await supabase
		.from("saved_addresses")
		.update({
			label: input.label,
			full_name: input.fullName,
			phone: input.phone,
			address_line: input.addressLine,
			city: input.city,
			province: input.province,
			is_default: input.isDefault,
		})
		.eq("id", addressId)
		.eq("user_id", userId);

	return { error };
}

/** Delete an address (must belong to userId). */
export async function deleteAddress(
	userId: string,
	addressId: string,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { error } = await supabase
		.from("saved_addresses")
		.delete()
		.eq("id", addressId)
		.eq("user_id", userId);

	return { error };
}

/** Set an address as the default, unsetting all others for the user. */
export async function setDefaultAddress(
	userId: string,
	addressId: string,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Verify ownership
	const { data: existing, error: fetchError } = await supabase
		.from("saved_addresses")
		.select("id, user_id")
		.eq("id", addressId)
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!existing) return { error: new Error("Address not found") };
	if ((existing as Record<string, unknown>).user_id !== userId) {
		return { error: new Error("Forbidden") };
	}

	// Unset all, then set this one
	const { error: unsetError } = await supabase
		.from("saved_addresses")
		.update({ is_default: false })
		.eq("user_id", userId);

	if (unsetError) return { error: unsetError };

	const { error } = await supabase
		.from("saved_addresses")
		.update({ is_default: true })
		.eq("id", addressId)
		.eq("user_id", userId);

	return { error };
}
