// ============================================================================
// Admin Feature — Types
// ============================================================================
//
// Domain types used across all admin pages. These types are shaped for the
// admin dashboard UI — not raw DB rows. Admin services map DB rows to these.
//
// Used by:
//   src/lib/features/admin/services.ts
//   src/app/admin/**

// ----------------------------------------------------------------------------
// KPIs
// ----------------------------------------------------------------------------

export type AdminKPIs = {
	totalUsers: number;
	totalSellers: number;
	activeListings: number;
	ordersToday: number;
	gmvToday: number;
	openDisputes: number;
	openFraudSignals: number;
	pendingMechanicVerifications: number;
};

// ----------------------------------------------------------------------------
// Users
// ----------------------------------------------------------------------------

export type AdminUser = {
	id: string;
	email: string;
	fullName: string | null;
	roles: string[];
	activeRole: string;
	city: string | null;
	createdAt: string;
	isBanned: boolean;
};

// ----------------------------------------------------------------------------
// Listings
// ----------------------------------------------------------------------------

export type AdminListing = {
	id: string;
	title: string;
	sellerId: string;
	storeName: string | null;
	price: number;
	status: string;
	condition: string;
	createdAt: string;
	viewCount: number;
};

// ----------------------------------------------------------------------------
// Orders
// ----------------------------------------------------------------------------

export type AdminOrder = {
	id: string;
	orderNumber: string;
	buyerId: string;
	sellerId: string;
	total: number;
	ssStatus: string;
	placedAt: string;
};

// ----------------------------------------------------------------------------
// Disputes
// ----------------------------------------------------------------------------

export type AdminDispute = {
	id: string;
	orderId: string;
	orderNumber: string;
	openedBy: string;
	reason: string;
	status: string;
	createdAt: string;
	resolutionNote: string | null;
};

// ----------------------------------------------------------------------------
// Fraud
// ----------------------------------------------------------------------------

export type FraudSignal = {
	id: string;
	subjectType: string;
	subjectId: string;
	signalType: string;
	score: number;
	status: string;
	createdAt: string;
	details: Record<string, unknown>;
};

// ----------------------------------------------------------------------------
// Admin Actions (audit log)
// ----------------------------------------------------------------------------

export type AdminAction = {
	id: string;
	adminId: string;
	targetType: string;
	targetId: string;
	action: string;
	note: string | null;
	createdAt: string;
};

// ----------------------------------------------------------------------------
// Sellers
// ----------------------------------------------------------------------------

export type AdminSeller = {
	id: string;
	storeName: string;
	slug: string;
	ownerId: string;
	ownerName: string | null;
	city: string;
	verified: boolean;
	rating: number;
	listingCount: number;
	createdAt: string;
};

// ----------------------------------------------------------------------------
// Mechanics
// ----------------------------------------------------------------------------

export type AdminMechanic = {
	id: string;
	fullName: string | null;
	specialties: string[];
	serviceAreas: string[];
	verified: boolean;
	verifiedAt: string | null;
	totalJobs: number;
	rating: number;
	createdAt: string;
};

// ----------------------------------------------------------------------------
// Categories
// ----------------------------------------------------------------------------

export type AdminCategory = {
	id: string;
	name: string;
	slug: string;
	parentId: string | null;
	parentName: string | null;
	childCount: number;
	listingCount: number;
};

// ----------------------------------------------------------------------------
// Vehicles
// ----------------------------------------------------------------------------

export type AdminVehicle = {
	id: string;
	make: string;
	model: string;
	yearStart: number | null;
	yearEnd: number | null;
	bodyType: string | null;
	engine: string | null;
};

// ----------------------------------------------------------------------------
// KB Documents
// ----------------------------------------------------------------------------

export type KBDocument = {
	id: string;
	title: string;
	sourceUrl: string | null;
	createdAt: string;
};

// ----------------------------------------------------------------------------
// Payouts
// ----------------------------------------------------------------------------

export type AdminPayout = {
	id: string;
	sellerId: string;
	sellerName: string | null;
	periodStart: string;
	periodEnd: string;
	amount: number;
	status: string;
	method: string | null;
	createdAt: string;
};

// ----------------------------------------------------------------------------
// Platform Settings
// ----------------------------------------------------------------------------

export type PlatformSetting = {
	key: string;
	value: string;
	updatedAt: string;
};
