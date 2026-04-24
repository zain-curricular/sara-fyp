// ============================================================================
// Mechanic — Types
// ============================================================================
//
// Domain types for the mechanic feature. Mechanics are verified automotive
// professionals who inspect parts and submit compatibility verdicts.
//
// MechanicProfile extends the base profiles table with mechanic-specific
// columns from the `mechanics` table. MechanicVerificationRequest mirrors
// the buyer's part-verification request flow but from the mechanic's view.

export type MechanicProfile = {
	id: string;
	specialties: string[];
	serviceAreas: string[];
	hourlyRate: number;
	verifiedAt: string | null;
	totalJobs: number;
	rating: number | null;
	profile: {
		fullName: string | null;
		avatarUrl: string | null;
		city: string | null;
	};
};

export type VerificationVerdict =
	| "verified_compatible"
	| "verified_incompatible"
	| "rejected";

export type VerificationStatus =
	| "pending"
	| "assigned"
	| "completed"
	| "cancelled";

export type MechanicVerificationRequest = {
	id: string;
	buyerId: string;
	listingId: string;
	mechanicId: string | null;
	status: VerificationStatus;
	verdict: VerificationVerdict | null;
	notes: string | null;
	buyerNotes: string | null;
	respondedAt: string | null;
	createdAt: string;
	listing: {
		title: string;
		price: number;
		city: string;
		imageUrl: string | null;
		category: string | null;
	} | null;
	vehicle: {
		make: string | null;
		model: string | null;
		year: number | null;
	} | null;
};
