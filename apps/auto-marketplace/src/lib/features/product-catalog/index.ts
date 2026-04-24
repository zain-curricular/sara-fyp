/** Client barrel — import from `@/lib/features/product-catalog` only. */

export type {
	Brand,
	CatalogPlatform,
	CatalogVariant,
	ListingSummary,
	Model,
	Specification,
} from "./types";

export { catalogUuidParamSchema } from "./schemas";

export { useBrands, useModels, useVariants } from "./hooks";

export { extractVariantsFromSpecs } from "./utils";
