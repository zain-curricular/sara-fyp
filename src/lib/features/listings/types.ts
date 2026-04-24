/**
 * Listing shapes for auto marketplace UI (subset of DB `listings` + `listing_images`).
 */

export type ListingRecord = {
	id: string;
	user_id: string;
	platform: "mobile" | "automotive";
	category_id: string;
	model_id: string | null;
	title: string;
	description: string | null;
	sale_type: "fixed" | "auction" | "both";
	price: number;
	is_negotiable: boolean;
	condition: string;
	details: Record<string, unknown>;
	city: string;
	area: string | null;
	status: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type ListingImageRecord = {
	id: string;
	listing_id: string;
	storage_path: string;
	url: string;
	position: number;
};

export type ListingsPagination = {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
};

export type CategoryOption = {
	id: string;
	name: string;
	slug: string;
};
