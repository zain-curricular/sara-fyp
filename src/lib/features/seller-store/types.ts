// ============================================================================
// Seller Store — Types
// ============================================================================
//
// Domain types for the seller_stores table and analytics payload.
// All server services live in services.ts (server barrel).

export type SellerStore = {
	id: string;
	ownerId: string;
	storeName: string;
	slug: string;
	logoUrl: string | null;
	bannerUrl: string | null;
	city: string;
	description: string;
	verified: boolean;
	rating: number;
	reviewCount: number;
	createdAt: string;
};

// ----------------------------------------------------------------------------
// Analytics
// ----------------------------------------------------------------------------

export type RevenueByDay = {
	date: string;
	revenue: number;
};

export type TopListing = {
	id: string;
	title: string;
	revenue: number;
	orders: number;
};

export type OrdersByStatus = {
	status: string;
	count: number;
};

export type AnalyticsKpis = {
	totalRevenue: number;
	totalOrders: number;
	avgOrderValue: number;
	activeListings: number;
};

export type AnalyticsPayload = {
	revenueByDay: RevenueByDay[];
	topListings: TopListing[];
	ordersByStatus: OrdersByStatus[];
	kpis: AnalyticsKpis;
};
