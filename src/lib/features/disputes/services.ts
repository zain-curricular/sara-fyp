// ============================================================================
// Disputes — Server Services
// ============================================================================
//
// Business logic and data access for the dispute lifecycle.
// All functions return { data, error } — never throw.
//
// Services:
//   listDisputesForSeller  — disputes on seller's orders
//   listDisputesForBuyer   — disputes opened by buyer
//   openDispute            — buyer opens dispute, transitions order to 'disputed'
//   getDisputeDetail       — fetch dispute for buyer, seller, or admin
//   addDisputeEvidence     — append evidence URLs to existing dispute

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Dispute, DisputeReason } from "./types";

// ----------------------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------------------

function mapRow(row: Record<string, unknown>, orderRow?: Record<string, unknown>): Dispute {
	return {
		id: row.id as string,
		orderId: row.order_id as string,
		openedBy: row.opened_by as string,
		reason: row.reason as Dispute["reason"],
		description: (row.description as string) ?? "",
		evidenceUrls: (row.evidence_urls as string[]) ?? [],
		status: row.status as Dispute["status"],
		resolutionNote: (row.resolution_note as string | null) ?? null,
		resolvedBy: (row.resolved_by as string | null) ?? null,
		createdAt: row.created_at as string,
		resolvedAt: (row.resolved_at as string | null) ?? null,
		sellerReply: (row.seller_reply as string | null) ?? null,
		sellerRepliedAt: (row.seller_replied_at as string | null) ?? null,
		order: orderRow
			? {
					orderNumber: orderRow.order_number as string,
					buyerId: orderRow.buyer_id as string,
					sellerId: orderRow.seller_id as string,
					total: orderRow.total as number,
				}
			: undefined,
	};
}

// ----------------------------------------------------------------------------
// Exported functions
// ----------------------------------------------------------------------------

/** List disputes where the seller_id on the order matches sellerId. */
export async function listDisputesForSeller(
	sellerId: string,
): Promise<{ data: Dispute[]; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("disputes")
		.select(`
			id, order_id, opened_by, reason, description,
			evidence_urls, status, resolution_note, resolved_by,
			created_at, resolved_at, seller_reply, seller_replied_at,
			orders (order_number, buyer_id, seller_id, total)
		`)
		.order("created_at", { ascending: false })
		.limit(100);

	if (error) return { data: [], error };

	// Filter client-side since RLS may not join seller_id directly
	const rows = (data ?? []) as Record<string, unknown>[];
	const filtered = rows.filter((row) => {
		const order = row.orders as Record<string, unknown> | null;
		return order?.seller_id === sellerId;
	});

	return {
		data: filtered.map((row) => mapRow(row, row.orders as Record<string, unknown>)),
		error: null,
	};
}

/** List disputes opened by a buyer. */
export async function listDisputesForBuyer(
	buyerId: string,
): Promise<{ data: Dispute[]; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("disputes")
		.select(`
			id, order_id, opened_by, reason, description,
			evidence_urls, status, resolution_note, resolved_by,
			created_at, resolved_at, seller_reply, seller_replied_at,
			orders (order_number, buyer_id, seller_id, total)
		`)
		.eq("opened_by", buyerId)
		.order("created_at", { ascending: false })
		.limit(100);

	if (error) return { data: [], error };

	return {
		data: (data ?? []).map((row) => {
			const r = row as Record<string, unknown>;
			return mapRow(r, r.orders as Record<string, unknown>);
		}),
		error: null,
	};
}

/**
 * Buyer opens a dispute against an order.
 * Validates: order exists, buyer owns it, status is eligible.
 * Inserts dispute row + transitions order ss_status to 'disputed'.
 */
export async function openDispute(
	buyerId: string,
	orderId: string,
	reason: DisputeReason,
	description: string,
	evidenceUrls: string[],
): Promise<{ data: { disputeId: string } | null; error: unknown }> {
	const admin = createAdminSupabaseClient();

	// 1 — Validate order
	const { data: orderRow, error: orderError } = await admin
		.from("orders")
		.select("id, buyer_id, seller_id, ss_status, order_number")
		.eq("id", orderId)
		.maybeSingle();

	if (orderError) return { data: null, error: orderError };
	if (!orderRow) return { data: null, error: new Error("Order not found") };

	const order = orderRow as Record<string, unknown>;

	if (order.buyer_id !== buyerId) return { data: null, error: new Error("Forbidden") };

	const eligibleStatuses = ["paid_escrow", "accepted", "shipped", "delivered"];
	if (!eligibleStatuses.includes(order.ss_status as string)) {
		return {
			data: null,
			error: new Error(`Cannot open dispute for order in status '${order.ss_status as string}'`),
		};
	}

	// 2 — Insert dispute
	const { data: dispute, error: disputeError } = await admin
		.from("disputes")
		.insert({
			order_id: orderId,
			opened_by: buyerId,
			reason,
			description,
			evidence_urls: evidenceUrls,
			status: "open",
		})
		.select("id")
		.single();

	if (disputeError) return { data: null, error: disputeError };

	// 3 — Transition order to 'disputed'
	await admin
		.from("orders")
		.update({ ss_status: "disputed" })
		.eq("id", orderId);

	return { data: { disputeId: (dispute as Record<string, unknown>).id as string }, error: null };
}

/** Fetch a single dispute — viewer must be buyer, seller, or admin. */
export async function getDisputeDetail(
	disputeId: string,
	viewerId: string,
): Promise<{ data: Dispute | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("disputes")
		.select(`
			id, order_id, opened_by, reason, description,
			evidence_urls, status, resolution_note, resolved_by,
			created_at, resolved_at, seller_reply, seller_replied_at,
			orders (order_number, buyer_id, seller_id, total)
		`)
		.eq("id", disputeId)
		.maybeSingle();

	if (error) return { data: null, error };
	if (!data) return { data: null, error: null };

	const row = data as Record<string, unknown>;
	const order = row.orders as Record<string, unknown> | null;

	// Access check — buyer, seller, or admin (admin has no row restriction)
	const isBuyer = row.opened_by === viewerId;
	const isSeller = order?.seller_id === viewerId;

	if (!isBuyer && !isSeller) {
		return { data: null, error: new Error("Forbidden") };
	}

	return { data: mapRow(row, order ?? undefined), error: null };
}

/** Append additional evidence URLs to an existing dispute. */
export async function addDisputeEvidence(
	disputeId: string,
	userId: string,
	urls: string[],
): Promise<{ error: unknown }> {
	const admin = createAdminSupabaseClient();

	// Fetch current evidence
	const { data: row, error: fetchError } = await admin
		.from("disputes")
		.select("id, opened_by, evidence_urls, orders (seller_id)")
		.eq("id", disputeId)
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!row) return { error: new Error("Dispute not found") };

	const r = row as Record<string, unknown>;
	const order = r.orders as Record<string, unknown> | null;

	const isBuyer = r.opened_by === userId;
	const isSeller = order?.seller_id === userId;
	if (!isBuyer && !isSeller) return { error: new Error("Forbidden") };

	const existing = (r.evidence_urls as string[]) ?? [];
	const merged = Array.from(new Set([...existing, ...urls]));

	const { error } = await admin
		.from("disputes")
		.update({ evidence_urls: merged })
		.eq("id", disputeId);

	return { error };
}
