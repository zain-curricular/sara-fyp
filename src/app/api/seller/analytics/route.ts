// ============================================================================
// GET /api/seller/analytics
// ============================================================================
//
// Returns revenue, order, and listing analytics for the authenticated seller.
//
// Response shape:
//   {
//     ok: true,
//     data: {
//       revenueByDay: [{date, revenue}]
//       topListings: [{id, title, revenue, orders}]
//       ordersByStatus: [{status, count}]
//       kpis: {totalRevenue, totalOrders, avgOrderValue, activeListings}
//     }
//   }

import "server-only";

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getSellerAnalytics } from "@/lib/features/seller-store/services";

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { data, error } = await getSellerAnalytics(auth.userId);

	if (error) {
		console.error("[GET /api/seller/analytics]", error);
		return NextResponse.json({ ok: false, error: "Failed to load analytics" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}
