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
// Tables: profiles, product catalog, listings, listing_images, subscriptions,
// orders, reviews, favorites, viewed_listings (slice).
// Functions: subscription escrow RPCs (see 20260418000006_subscription_escrow_atomic.sql).

/** JSON column / RPC payload — mirrors `supabase gen types` `Json`. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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

export type BidStatus = 'active' | 'outbid' | 'won' | 'lost' | 'cancelled'

export type PaymentMethod = 'jazzcash' | 'easypaisa' | 'stripe' | 'bank_transfer'

export type EscrowTxType = 'hold' | 'release' | 'refund'

export type EscrowTxStatus = 'pending' | 'completed' | 'failed'

/**
 * `escrow_transactions` row — orders escrow + nullable order_id for subscription checkout.
 */
export type EscrowTransactionRow = {
	id: string
	order_id: string | null
	type: EscrowTxType
	amount: number
	payment_method: PaymentMethod
	external_tx_id: string | null
	status: EscrowTxStatus
	metadata: Record<string, unknown>
	created_at: string
}

/** `order_status` enum — 20260416000001_enums.sql */
export type OrderStatus =
	| 'awaiting_payment'
	| 'payment_received'
	| 'shipped_to_center'
	| 'under_testing'
	| 'testing_complete'
	| 'approved'
	| 'rejected'
	| 'shipped_to_buyer'
	| 'delivered'
	| 'completed'
	| 'cancelled'
	| 'refunded'

/**
 * `orders` row — 20260416000006_orders_escrow.sql (columns used by reviews flow).
 */
export type OrderRow = {
	id: string
	listing_id: string
	buyer_id: string
	seller_id: string
	amount: number
	status: OrderStatus
	shipping_tracking_to_center: string | null
	shipping_tracking_to_buyer: string | null
	paid_at: string | null
	shipped_to_center_at: string | null
	received_at_center_at: string | null
	testing_completed_at: string | null
	approved_at: string | null
	rejected_at: string | null
	shipped_to_buyer_at: string | null
	delivered_at: string | null
	completed_at: string | null
	cancelled_at: string | null
	created_at: string
	updated_at: string
}

/**
 * `reviews` row — 20260416000009_social.sql + reviews_not_self_ck.
 */
export type ReviewRow = {
	id: string
	reviewer_id: string
	reviewed_user_id: string
	order_id: string
	listing_id: string
	rating: number
	comment: string | null
	created_at: string
}

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
 * `auction_config` row — 20260416000005_auctions.sql.
 */
export type AuctionConfigRow = {
	id: string
	listing_id: string
	starting_price: number
	min_increment: number
	auction_start_at: string
	auction_end_at: string
	anti_snipe_minutes: number
	created_at: string
	updated_at: string
}

/**
 * `bids` row — created via `place_bid` RPC only.
 */
export type BidRow = {
	id: string
	listing_id: string
	bidder_id: string
	amount: number
	status: BidStatus
	is_auto_bid: boolean
	created_at: string
}

/**
 * `auto_bids` row — proxy bidding ceiling per user per listing.
 */
export type AutoBidRow = {
	id: string
	listing_id: string
	user_id: string
	max_amount: number
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
			orders: {
				Row: OrderRow
				Insert: Partial<OrderRow> &
					Pick<OrderRow, 'listing_id' | 'buyer_id' | 'seller_id' | 'amount' | 'status'>
				Update: Partial<OrderRow>
				Relationships: []
			}
			reviews: {
				Row: ReviewRow
				Insert: Partial<ReviewRow> &
					Pick<ReviewRow, 'reviewer_id' | 'reviewed_user_id' | 'order_id' | 'listing_id' | 'rating'>
				Update: Partial<ReviewRow>
				Relationships: []
			}
			escrow_transactions: {
				Row: EscrowTransactionRow
				Insert: Partial<EscrowTransactionRow> &
					Pick<EscrowTransactionRow, 'type' | 'amount' | 'payment_method'>
				Update: Partial<EscrowTransactionRow>
				Relationships: []
			}
			auction_config: {
				Row: AuctionConfigRow
				Insert: Partial<AuctionConfigRow> & Pick<AuctionConfigRow, 'listing_id' | 'starting_price' | 'auction_end_at'>
				Update: Partial<AuctionConfigRow>
				Relationships: []
			}
			bids: {
				Row: BidRow
				Insert: Partial<BidRow> & Pick<BidRow, 'listing_id' | 'bidder_id' | 'amount'>
				Update: Partial<BidRow>
				Relationships: []
			}
			auto_bids: {
				Row: AutoBidRow
				Insert: Partial<AutoBidRow> & Pick<AutoBidRow, 'listing_id' | 'user_id' | 'max_amount'>
				Update: Partial<AutoBidRow>
				Relationships: []
			}
		}
		Views: Record<never, never>
		Functions: {
			complete_subscription_escrow: {
				Args: {
					p_escrow_id: string
					p_external_tx_id: string | null
				}
				Returns: Json
			}
			fail_subscription_escrow: {
				Args: {
					p_escrow_id: string
				}
				Returns: Json
			}
			place_bid: {
				Args: {
					p_listing_id: string
					p_amount: number
				}
				Returns: Json
			}
			create_buy_now_order: {
				Args: {
					p_listing_id: string
				}
				Returns: Json
			}
			transition_order: {
				Args: {
					p_order_id: string
					p_new_status: OrderStatus
					p_metadata?: Json
				}
				Returns: Json
			}
		}
		Enums: {
			platform_type: PlatformType
			user_role: ProfileRow['role']
			listing_status: ListingStatus
			sale_type: SaleType
			item_condition: ItemCondition
			subscription_tier: SubscriptionTier
			order_status: OrderStatus
			payment_method: PaymentMethod
			escrow_tx_type: EscrowTxType
			escrow_tx_status: EscrowTxStatus
			bid_status: BidStatus
		}
		CompositeTypes: Record<never, never>
	}
}
