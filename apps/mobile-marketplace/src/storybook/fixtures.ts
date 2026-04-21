import type { CategoryOption, ListingImageRecord, ListingRecord, ListingsSearchParams } from "@/lib/features/listings";
import type { OwnProfile } from "@/lib/features/profiles/types";
import type { SellerReviewsBundle } from "@/lib/features/reviews/hooks";
import type { ReviewRecord } from "@/lib/features/reviews/types";

import type { ActiveFilterChip } from "@/components/listings/filter-chips";
import type { ProfileHeaderModel } from "@/components/profiles/profile-header";
import type { ProfileStatsModel } from "@/components/profiles/profile-stats";

const ISO = "2025-01-15T12:00:00.000Z";

export const mockListingId = "a0000000-0000-4000-8000-000000000001";
export const mockUserId = "a0000000-0000-4000-8000-000000000002";
export const mockCategoryId = "a0000000-0000-4000-8000-000000000003";
export const mockOrderId = "a0000000-0000-4000-8000-000000000004";

export const mockCategories: CategoryOption[] = [
	{ id: mockCategoryId, name: "Phones", slug: "phones" },
	{ id: "b0000000-0000-4000-8000-000000000001", name: "Accessories", slug: "accessories" },
];

export const mockListing: ListingRecord = {
	id: mockListingId,
	user_id: mockUserId,
	platform: "mobile",
	category_id: mockCategoryId,
	model_id: null,
	title: "iPhone 15 Pro — 256GB — unlocked",
	description: "Light wear on frame; battery health 94%. Includes box and cable.",
	sale_type: "fixed",
	price: 899,
	is_negotiable: true,
	condition: "excellent",
	details: {},
	city: "Karachi",
	area: null,
	status: "active",
	created_at: ISO,
	updated_at: ISO,
	deleted_at: null,
};

export const mockListingWithSpecs: ListingRecord = {
	...mockListing,
	details: {
		storage: "256 GB",
		color: "Natural titanium",
		imei: "35xxxxxxxxxxxx1",
	},
};

export const mockListingImages: ListingImageRecord[] = [
	{
		id: "c0000000-0000-4000-8000-000000000001",
		listing_id: mockListingId,
		storage_path: "listings/demo/front.jpg",
		url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop",
		position: 0,
	},
	{
		id: "c0000000-0000-4000-8000-000000000002",
		listing_id: mockListingId,
		storage_path: "listings/demo/back.jpg",
		url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop",
		position: 1,
	},
];

export const mockReview: ReviewRecord = {
	id: "d0000000-0000-4000-8000-000000000001",
	reviewer_id: "d0000000-0000-4000-8000-000000000002",
	reviewed_user_id: mockUserId,
	order_id: mockOrderId,
	listing_id: mockListingId,
	rating: 5,
	comment: "Fast shipping, item exactly as described.",
	created_at: ISO,
};

export const mockReviewNoComment: ReviewRecord = {
	...mockReview,
	id: "d0000000-0000-4000-8000-000000000003",
	rating: 4,
	comment: null,
};

export const mockSellerReviewsBundle: SellerReviewsBundle = {
	items: [mockReview, mockReviewNoComment],
	pagination: { total: 2, limit: 10, offset: 0, hasMore: false },
};

export const mockSellerReviewsEmpty: SellerReviewsBundle = {
	items: [],
	pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
};

export const mockProfileHeader: ProfileHeaderModel = {
	display_name: "Sana Khan",
	handle: "sana_mobiles",
	avatar_url: null,
	is_verified: true,
	role: "seller",
};

export const mockProfileStats: ProfileStatsModel = {
	avg_rating: 4.7,
	total_reviews: 23,
	total_listings: 12,
	total_sales: 40,
};

export const mockOwnProfile: OwnProfile = {
	id: mockUserId,
	role: "seller",
	display_name: "Sana Khan",
	avatar_url: null,
	phone_number: "+923001234567",
	phone_verified: true,
	email: "seller@example.com",
	city: "Karachi",
	area: "Clifton",
	bio: "Trusted mobile seller — tested devices, clear grading.",
	is_verified: true,
	is_banned: false,
	avg_rating: 4.7,
	total_reviews: 23,
	total_listings: 12,
	total_sales: 40,
	created_at: ISO,
	updated_at: ISO,
	handle: "sana_mobiles",
	onboarding_completed_at: ISO,
	last_seen_at: ISO,
	locale: "en",
};

export const mockSearchInitial: ListingsSearchParams = {
	platform: "mobile",
	q: "iphone",
	city: "Karachi",
	price_min: 500,
	price_max: 1200,
	page: 1,
	limit: 20,
};

export const mockFilterChips: ActiveFilterChip[] = [
	{ key: "q", label: 'Search: "iphone"', removeHref: "/search?platform=mobile" },
	{ key: "city", label: "Karachi", removeHref: "/search?platform=mobile&q=iphone" },
];
