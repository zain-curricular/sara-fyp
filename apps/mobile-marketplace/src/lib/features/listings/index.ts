/** Client barrel — import from `@/lib/features/listings` only. */

export type { CategoryOption, ListingImageRecord, ListingRecord, ListingsPagination } from "./types";

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
