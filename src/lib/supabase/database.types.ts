// ============================================================================
// Supabase database.types (manual slice)
// ============================================================================
//
// Hand-maintained Row/Insert/Update shapes for tables used in TypeScript until
// `npm run supabase:gen-types` replaces this file. Keeps feature code aligned
// with migrations under supabase/migrations/.
//
// Scope
// -----
// Tables: profiles, product catalog, listings, listing_images, subscriptions (slice).

/**
 * Full `profiles` row — mirrors public.profiles including refinements migration.
 */
export type ProfileRow = {
	id: string
	role: 'user' | 'seller' | 'tester' | 'admin'
	display_name: string | null
	avatar_url: string | null
	phone_number: string | null
	phone_verified: boolean
	email: string | null
	city: string | null
	area: string | null
	bio: string | null
	is_verified: boolean
	is_banned: boolean
	avg_rating: number
	total_reviews: number
	total_listings: number
	total_sales: number
	created_at: string
	updated_at: string
	handle: string | null
	onboarding_completed_at: string | null
	last_seen_at: string | null
	locale: string
}

/** Shared enum from migration 20260416000001_enums.sql */
export type PlatformType = 'mobile' | 'automotive'

export type ListingStatus =
	| 'draft'
	| 'pending_review'
	| 'active'
	| 'sold'
	| 'expired'
	| 'removed'
	| 'flagged'

export type SaleType = 'fixed' | 'auction' | 'both'

export type ItemCondition = 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor'

export type SubscriptionTier = 'free' | 'premium' | 'wholesale'

/**
 * `categories` row — hierarchical catalog nodes per platform.
 */
export type CategoryRow = {
	id: string
	platform: PlatformType
	name: string
	slug: string
	parent_id: string | null
	icon_url: string | null
	position: number
	is_active: boolean
	spec_schema: Record<string, unknown>
	created_at: string
	updated_at: string
}

/**
 * `brands` row — manufacturers per platform.
 */
export type BrandRow = {
	id: string
	platform: PlatformType
	name: string
	slug: string
	logo_url: string | null
	created_at: string
	updated_at: string
}

/**
 * `models` row — SKU within a brand and category.
 */
export type ModelRow = {
	id: string
	brand_id: string
	category_id: string
	name: string
	slug: string
	year: number | null
	image_url: string | null
	is_active: boolean
	created_at: string
	updated_at: string
}

/**
 * `specifications` row — 1:1 JSONB spec sheet for a model.
 */
export type SpecificationRow = {
	id: string
	model_id: string
	specs: Record<string, unknown>
	created_at: string
	updated_at: string
}

/**
 * `listings` row — core marketplace listing (see 20260416000004_listings.sql).
 */
export type ListingRow = {
	id: string
	user_id: string
	platform: PlatformType
	category_id: string
	model_id: string | null
	title: string
	description: string | null
	ai_description: string | null
	sale_type: SaleType
	price: number
	is_negotiable: boolean
	condition: ItemCondition
	details: Record<string, unknown>
	ai_rating: Record<string, unknown> | null
	city: string
	area: string | null
	status: ListingStatus
	current_bid: number | null
	current_bidder_id: string | null
	search_vector: unknown | null
	published_at: string | null
	expires_at: string | null
	sold_at: string | null
	created_at: string
	updated_at: string
	deleted_at: string | null
	/** Denormalized favorites count (see 20260418000003_favorites_viewed_refinements.sql). */
	favorite_count: number
}

/**
 * `listing_images` row — ordered photos (max 10 positions).
 */
export type ListingImageRow = {
	id: string
	listing_id: string
	storage_path: string
	url: string
	position: number
	created_at: string
}

/**
 * `favorites` row — wishlist junction (20260416000009_social.sql).
 */
export type FavoriteRow = {
	id: string
	user_id: string
	listing_id: string
	created_at: string
}

/**
 * `viewed_listings` row — browse history (20260416000009_social.sql).
 */
export type ViewedListingHistoryRow = {
	id: string
	user_id: string
	listing_id: string
	viewed_at: string
}

/**
 * `subscriptions` row — seller plan limits (20260416000009_social.sql).
 */
export type SubscriptionRow = {
	id: string
	user_id: string
	tier: SubscriptionTier
	starts_at: string
	expires_at: string | null
	max_active_listings: number
	max_featured_listings: number
	is_active: boolean
	created_at: string
	updated_at: string
}

/**
 * Minimal Database generic for typed Supabase clients.
 *
 * Structure mirrors `supabase gen types` output: `Tables`, `Views`, `Functions`,
 * `Enums`, `CompositeTypes` must all be present (even if empty) so the SDK's
 * generic constraints resolve.
 */
export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: ProfileRow
				Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id'>
				Update: Partial<ProfileRow>
				Relationships: []
			}
			categories: {
				Row: CategoryRow
				Insert: Partial<CategoryRow> & Pick<CategoryRow, 'platform' | 'name' | 'slug'>
				Update: Partial<CategoryRow>
				Relationships: []
			}
			brands: {
				Row: BrandRow
				Insert: Partial<BrandRow> & Pick<BrandRow, 'platform' | 'name' | 'slug'>
				Update: Partial<BrandRow>
				Relationships: []
			}
			models: {
				Row: ModelRow
				Insert: Partial<ModelRow> & Pick<ModelRow, 'brand_id' | 'category_id' | 'name' | 'slug'>
				Update: Partial<ModelRow>
				Relationships: []
			}
			specifications: {
				Row: SpecificationRow
				Insert: Partial<SpecificationRow> & Pick<SpecificationRow, 'model_id'>
				Update: Partial<SpecificationRow>
				Relationships: []
			}
			listings: {
				Row: ListingRow
				Insert: Partial<ListingRow> &
					Pick<ListingRow, 'platform' | 'category_id' | 'title' | 'price' | 'condition' | 'city'>
				Update: Partial<ListingRow>
				Relationships: []
			}
			listing_images: {
				Row: ListingImageRow
				Insert: Partial<ListingImageRow> & Pick<ListingImageRow, 'listing_id' | 'storage_path' | 'url'>
				Update: Partial<ListingImageRow>
				Relationships: []
			}
			subscriptions: {
				Row: SubscriptionRow
				Insert: Partial<SubscriptionRow> & Pick<SubscriptionRow, 'user_id'>
				Update: Partial<SubscriptionRow>
				Relationships: []
			}
			favorites: {
				Row: FavoriteRow
				Insert: Partial<FavoriteRow> & Pick<FavoriteRow, 'user_id' | 'listing_id'>
				Update: Partial<FavoriteRow>
				Relationships: []
			}
			viewed_listings: {
				Row: ViewedListingHistoryRow
				Insert: Partial<ViewedListingHistoryRow> & Pick<ViewedListingHistoryRow, 'user_id' | 'listing_id'>
				Update: Partial<ViewedListingHistoryRow>
				Relationships: []
			}
		}
		Views: Record<never, never>
		Functions: Record<never, never>
		Enums: {
			platform_type: PlatformType
			user_role: ProfileRow['role']
			listing_status: ListingStatus
			sale_type: SaleType
			item_condition: ItemCondition
			subscription_tier: SubscriptionTier
		}
		CompositeTypes: Record<never, never>
	}
}
