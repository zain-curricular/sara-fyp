// ============================================================================
// Mechanic Requests — Types
// ============================================================================
//
// Domain types for mechanic compatibility verification requests. A buyer
// requests a mechanic to verify whether a listing's part is compatible with
// their vehicle. Status follows a simple state machine:
//   pending → assigned → verified_compatible | verified_incompatible | rejected
//   pending → expired (after TTL passes with no assignment)

export type MechanicRequestStatus =
	| "pending"
	| "assigned"
	| "verified_compatible"
	| "verified_incompatible"
	| "rejected"
	| "expired";

export type MechanicRequest = {
	id: string;
	requesterId: string;
	listingId: string;
	vehicleId: string;
	vehicleDetails: string | null;
	mechanicId: string | null;
	status: MechanicRequestStatus;
	mechanicNotes: string | null;
	fee: number;
	paid: boolean;
	createdAt: string;
	respondedAt: string | null;
	listing?: {
		title: string;
		images: string[];
	};
	vehicle?: {
		make: string;
		model: string;
		yearFrom: number;
		yearTo: number;
	};
	mechanic?: {
		fullName: string;
		rating: number | null;
	};
};
