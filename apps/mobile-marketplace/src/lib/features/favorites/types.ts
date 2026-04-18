import type { ListingRecord } from "@/lib/features/listings/types";

/** One row from GET /api/favorites/me — listing plus when it was saved. */
export type FavoriteListingRow = {
	listing: ListingRecord;
	favorited_at: string;
};

/** One row from GET /api/me/recent-views — listing plus last viewed time. */
export type ViewedListingRow = {
	listing: ListingRecord;
	viewed_at: string;
};

export type FavoritesListPayload = {
	items: FavoriteListingRow[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
};

export type ViewedListPayload = {
	items: ViewedListingRow[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
};
