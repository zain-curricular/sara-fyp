/** Client barrel — import hooks/types from `@/lib/features/favorites`. Server fetch: `@/lib/features/favorites/services`. */

export type { FavoriteListingRow, FavoritesListPayload, ViewedListingRow, ViewedListPayload } from "./types";

export { favoritesAndViewsQuery } from "./query";

export { useFavorites, useToggleFavorite, useViewedHistory } from "./hooks";
