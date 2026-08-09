# ShopSmart Build Notes

## Schema Decisions

### Profiles
The existing `profiles.role` column (enum) is preserved. Added `roles text[] DEFAULT ARRAY['buyer']` and `active_role text DEFAULT 'buyer'` alongside it for multi-role support. Auth guards use `roles` for permission checks; `role` is kept for backward compat with existing RLS policies.

### Orders
The existing `order_status` enum (12 states, device-testing workflow) is preserved. ShopSmart adds `ss_status text` column and `order_number text` to the same `orders` table. New tables `order_status_events` and `disputes` are added for ShopSmart-specific tracking. Existing escrow_transactions table is reused; ShopSmart adds `platform_fee` and `seller_payout` columns.

### Listings
Existing `listings` table augmented with: `store_id`, `slug`, `compare_at_price`, `min_order_qty`, `is_wholesale`, `ai_generated_fields jsonb`, `embedding vector(1536)`. Existing columns preserved for backward compat.

### Part Categories vs Categories
The existing `categories` table (platform-specific: mobile/automotive) is preserved. New `part_categories` table is created for ShopSmart hierarchical spare-parts taxonomy (Engine → Oil Filters, etc.). Listings reference `part_categories.id` via the existing `category_id` column (accepts either table's UUIDs from the DB perspective).

### Condition Enum
The existing `item_condition` enum has different values (new, like_new, excellent, good, fair, poor) from the ShopSmart spec (new, used, refurbished, oem, aftermarket). New `listing_condition` TEXT column added to listings for ShopSmart condition values. Existing `condition` column preserved.

## Convention Conflicts

### AI Provider
LangChain.js is not in the existing package.json. Added `langchain`, `@langchain/openai`, `@langchain/community`. Stubbed behind `lib/ai/provider.ts` interface so it degrades gracefully if OPENAI_API_KEY is missing.

### Recharts
Not in existing package.json. Added for seller analytics charts.

### date-fns
Not in existing package.json. Added for date formatting.

### pgvector
Enabled via migration. Requires Supabase project with pgvector extension available (all hosted Supabase projects support it).

## TODOs for Human

- Wire real payment gateway (JazzCash/EasyPaisa/Stripe) — currently stubbed as "mark paid on submit"
- Run `supabase db reset` against local Supabase to apply new migrations
- Set OPENAI_API_KEY in .env for AI features to work (chatbot, description generator, embeddings)
- Set SUPABASE_SERVICE_ROLE_KEY in .env for admin operations and edge functions
- Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env if not already set
- Configure Supabase storage bucket CORS for listing-images, avatars, etc.
- Deploy edge function `auto-release-escrow` for the 7-day auto-completion cron
- Verify pgvector extension is enabled on your Supabase project
- Seed Pakistani vehicles and part_categories by running the seed migrations
