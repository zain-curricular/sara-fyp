// ============================================================================
// Addresses — Types
// ============================================================================
//
// Domain types for saved shipping addresses. Addresses are stored per-user and
// support a single default flag. Province follows Pakistani administrative
// divisions. isDefault is enforced at service layer (unset others on create).

export type SavedAddress = {
	id: string;
	userId: string;
	label: string;
	fullName: string;
	phone: string;
	addressLine: string;
	city: string;
	province: string;
	isDefault: boolean;
	createdAt: string;
};
