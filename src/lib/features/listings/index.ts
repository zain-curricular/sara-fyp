/** Client barrel — import from `@/lib/features/listings` only. */

export type { CategoryOption, ListingImageRecord, ListingRecord, ListingsPagination } from "./types";

export {
	IMAGE_ALLOWED_TYPES,
	IMAGE_BUCKET,
	IMAGE_MAX_BYTES,
	IMAGE_MAX_PER_LISTING,
} from "./config";

export type { CreateListingWizardInput, ListingsSearchParams } from "./schemas";
export { createListingWizardSchema, listingsSearchParamsSchema } from "./schemas";

export {
	useCreateListing,
	useListingDetail,
	usePublishListing,
	useSearchListings,
	useUpdateListing,
	useUploadImages,
} from "./hooks";

export { toListingsApiQuery } from "./search-query";
