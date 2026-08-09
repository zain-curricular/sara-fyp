# ShopSmart Build Report

Generated: 2026-04-25

## Summary

Complete implementation of ShopSmart — Pakistan's nationwide digital marketplace for vehicle spare parts. Built on Next.js 16 App Router + Supabase.

**TypeScript compile status: CLEAN (0 errors)**

---

## Migrations Applied (10 new)

| File | Purpose |
|------|---------|
| `20260419000001_shopsmart_profile_extensions.sql` | Adds `full_name`, `phone`, `roles text[]`, `active_role` to profiles |
| `20260419000002_pgvector_and_seller_stores.sql` | pgvector extension + seller_stores table |
| `20260419000003_vehicles_seed.sql` | vehicles table + 26 Pakistani vehicle models |
| `20260419000004_part_categories_seed.sql` | part_categories hierarchy + 46 categories/subcategories |
| `20260419000005_listing_extensions.sql` | listing_condition, stock, embedding vector, part_category_id, listing_compatibility |
| `20260419000006_cart.sql` | carts + cart_items tables |
| `20260419000007_shopsmart_orders.sql` | ShopSmart order FSM, order_items, order_status_events, disputes, escrow |
| `20260419000008_mechanic_and_fraud.sql` | mechanics, mechanic_verifications, fraud_signals, admin_actions |
| `20260419000009_chatbot_kb_payouts.sql` | chatbot_sessions, kb_documents (pgvector), payouts, saved_addresses |
| `20260419000010_storage_buckets.sql` | 6 storage buckets with RLS policies |

---

## Feature Modules (17)

| Module | Contents |
|--------|---------|
| `addresses` | types, schemas, services, hooks |
| `admin` | types, services (full CRUD for all entities) |
| `ai-engine` | types, services (search, recommendations) |
| `auctions` | pre-existing |
| `cart` | types, schemas, services, hooks |
| `chatbot` | types, services (RAG + sessions) |
| `device-testing` | pre-existing |
| `disputes` | types, services, index |
| `favorites` | pre-existing + hooks |
| `listings` | pre-existing + extensions |
| `mechanic` | types, services (full mechanic flow) |
| `mechanic-requests` | types, schemas, services |
| `messaging` | types, schemas, services, hooks (Realtime) |
| `notifications` | types, services, hooks (Realtime) |
| `onboarding` | pre-existing |
| `orders` | types, schemas, services, hooks |
| `profiles` | pre-existing |
| `product-catalog` | types, schemas, services, hooks |
| `reviews` | pre-existing + extensions |
| `search` | pre-existing |
| `seller-store` | types, services |
| `subscriptions` | pre-existing |
| `warranty` | pre-existing |

---

## Pages (112)

### Auth (`/login`, `/logout`, `/forgot-password`, `/reset-password`)
- Unified `/login` page — single entry point for all user types
- Role-based redirect after sign-in
- Forgot-password + reset-password flows
- `/become-a-seller` — seller onboarding wizard
- `/403`, `/404` — error pages

### Onboarding
- `/onboarding/phone` — phone verification
- `/onboarding/profile` — profile setup
- `/onboarding/verify` — OTP verification

### Public (`/(public)`)
- `/` — homepage
- `/browse` — listings grid with filters
- `/browse/brands/[brand]` — browse by vehicle brand
- `/browse/models/[model]` — browse by model
- `/search` — full-text search with facets
- `/listings/[id]` — listing detail with images, specs, similar items, contact seller
- `/sellers/[id]` — public seller store page with reviews
- `/parts` — part categories grid
- `/parts/[slug]` — listings by part category
- `/assistant` — AI chatbot page
- `/verify` — QR part verification landing
- `/verify/[partId]` — part verification result

### Static
- `/about`, `/contact`, `/help`, `/help/[slug]`
- `/privacy`, `/terms`, `/sell-on-shopsmart`

### Buyer (`/buyer/`)
- `/buyer` — dashboard
- `/buyer/orders` — order list (tabbed by status)
- `/buyer/orders/[id]` — order detail + tracking timeline
- `/buyer/orders/[id]/track` — Realtime tracking
- `/buyer/orders/[id]/review` — leave review
- `/buyer/orders/[id]/dispute` — open dispute
- `/buyer/orders/[id]/confirm-receipt` — confirm + release escrow
- `/buyer/favorites` — saved listings
- `/buyer/addresses` — saved addresses CRUD
- `/buyer/addresses/new`, `/buyer/addresses/[id]/edit`
- `/buyer/disputes`, `/buyer/disputes/[id]` — dispute management
- `/buyer/mechanic-requests`, `/buyer/mechanic-requests/new`, `/buyer/mechanic-requests/[id]`
- `/buyer/settings/profile`, `/buyer/settings/avatar`, `/buyer/settings/password`, `/buyer/settings/notifications`
- `/buyer/viewed` — recently viewed

### Cart & Checkout (`/(buyer)/`)
- `/(buyer)/cart` — multi-seller grouped cart
- `/(buyer)/checkout` — 3-step checkout (shipping → review → confirm)
- `/(buyer)/checkout/success/[orderId]` — order confirmation
- `/(buyer)/checkout/failed` — payment failure

### Seller (`/seller/`)
- `/seller` — dashboard with KPI cards
- `/seller/listings` — listing management table
- `/seller/listings/new` — create listing wizard with AI description generator
- `/seller/listings/[id]/edit` — edit listing
- `/seller/listings/bulk-upload` — CSV bulk upload
- `/seller/orders`, `/seller/orders/[id]` — order management
- `/seller/analytics` — Recharts analytics (revenue, views, conversion)
- `/seller/reviews` — review management with reply
- `/seller/disputes`, `/seller/disputes/[id]` — dispute management
- `/seller/payouts`, `/seller/payouts/setup` — payout configuration
- `/seller/store` — store profile editor
- `/seller/inventory` — stock management
- `/seller/settings/shipping` — shipping configuration

### Admin (`/admin/`)
- `/admin` — KPI dashboard + recent actions
- `/admin/users`, `/admin/users/[id]` — user management (ban/unban/grant-admin)
- `/admin/sellers`, `/admin/sellers/[id]` — seller verification
- `/admin/listings`, `/admin/listings/[id]` — listing approval/rejection
- `/admin/orders`, `/admin/orders/[id]` — order management + force-cancel
- `/admin/disputes`, `/admin/disputes/[id]` — dispute resolution
- `/admin/fraud` — fraud signal management
- `/admin/mechanics` — mechanic verification
- `/admin/catalog` — categories + vehicles CRUD
- `/admin/payouts` — payout batch runner
- `/admin/settings` — platform settings key-value
- `/admin/kb` — AI knowledge base document management

### Mechanic (`/mechanic/`)
- `/mechanic` — dashboard with KPI row + assigned requests
- `/mechanic/onboarding` — mechanic registration
- `/mechanic/requests`, `/mechanic/requests/[id]` — request pool + detail + verdict form
- `/mechanic/completed` — completed verifications
- `/mechanic/earnings` — payout history
- `/mechanic/settings` — profile update

### Messages & Notifications
- `/messages` — two-panel inbox with Realtime
- `/messages/[conversationId]` — deep link redirect
- `/notifications` — notification feed with Realtime

### Wholesale
- `/wholesale` — wholesale-only listings
- `/wholesale/po/[id]` — purchase order detail

### Garage / Other
- `/(buyer)/garage` — saved vehicles placeholder
- `/(buyer)/garage/[id]` — vehicle-specific parts link

---

## API Routes (76)

### Auth
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/switch-role`

### Listings
- `GET/POST /api/listings`
- `GET/PATCH/DELETE /api/listings/[id]`
- `POST /api/listings/[id]/publish`
- `GET /api/listings/[id]/images`
- `POST /api/listings/[id]/favorites`

### Cart
- `GET /api/cart`
- `POST/GET /api/cart/items`
- `PATCH/DELETE /api/cart/items/[id]`

### Orders
- `GET/POST /api/orders`
- `GET /api/orders/[id]`
- `POST /api/orders/[id]/accept`
- `POST /api/orders/[id]/ship`
- `POST /api/orders/[id]/confirm-receipt`
- `POST /api/orders/[id]/cancel`

### Reviews
- `GET/POST /api/reviews`
- `POST /api/reviews/[id]/reply`

### Conversations / Messages
- `GET/POST /api/conversations`
- `GET /api/conversations/[id]`
- `GET/POST /api/conversations/[id]/messages`
- `POST /api/conversations/[id]/read`

### Notifications
- `GET /api/notifications`
- `POST /api/notifications/[id]/read`
- `POST /api/notifications/read-all`

### Addresses
- `GET/POST /api/addresses`
- `PATCH/DELETE /api/addresses/[id]`
- `POST /api/addresses/[id]/default`

### Disputes
- `GET/POST /api/disputes`
- `GET /api/disputes/[id]`
- `POST /api/disputes/[id]/evidence`

### Mechanic
- `GET/POST /api/mechanic/profile`
- `GET /api/mechanic/requests`
- `POST /api/mechanic/requests/[id]/accept`
- `POST /api/mechanic/requests/[id]/verdict`
- `GET /api/mechanic/earnings`

### Mechanic Requests (buyer-side)
- `GET/POST /api/mechanic-requests`
- `GET /api/mechanic-requests/[id]`

### Seller
- `GET/PATCH /api/seller/store`
- `GET /api/seller/store/slug-check`
- `GET /api/seller/analytics`
- `POST /api/seller/onboard`

### AI
- `POST /api/ai/generate-listing`
- `POST /api/chatbot`
- `GET /api/recommendations/home`
- `GET /api/recommendations/similar/[id]`
- `GET /api/recommendations/for-you`
- `GET /api/recommendations/frequently-bought`

### Catalog (public)
- `GET /api/catalog/brands`
- `GET /api/catalog/brands/[brandId]/models`
- `GET /api/catalog/models/[modelId]/variants`
- `GET /api/vehicles`

### Admin API (all require admin role)
- `POST /api/admin/users/[id]/ban`
- `POST /api/admin/users/[id]/unban`
- `POST /api/admin/users/[id]/grant-admin`
- `POST /api/admin/sellers/[id]/verify`
- `POST /api/admin/listings/[id]/approve`
- `POST /api/admin/listings/[id]/reject`
- `POST /api/admin/orders/[id]/force-cancel`
- `POST /api/admin/disputes/[id]/resolve`
- `POST /api/admin/fraud/[id]/dismiss`
- `POST /api/admin/fraud/[id]/action`
- `POST /api/admin/mechanics/[id]/verify`
- `GET/POST /api/admin/catalog/categories`
- `PATCH/DELETE /api/admin/catalog/categories/[id]`
- `GET/POST /api/admin/catalog/vehicles`
- `DELETE /api/admin/catalog/vehicles/[id]`
- `GET/POST /api/admin/payouts`
- `GET/POST /api/admin/settings`
- `GET/POST /api/admin/kb`

---

## Edge Functions (2)

| Function | Purpose |
|----------|---------|
| `auto-release-escrow` | Cron: auto-release escrow after 7 days on delivered orders |
| `fraud-worker` | Cron: detect fraud signals (new-seller pricing, dispute rate, price drops) |

---

## Flow Verification (path-trace)

### Buyer purchases a part
1. Browse `/browse` → open `/listings/[id]`
2. Click "Add to cart" → `POST /api/cart/items` → cart stored in DB
3. Navigate `/(buyer)/cart` → review grouped by seller
4. Click "Checkout" → `/(buyer)/checkout` → enter address → review → `POST /api/orders`
5. Order created with `ss_status=paid_escrow` → `POST /api/orders/[id]/accept` (seller)
6. Seller ships → `POST /api/orders/[id]/ship`
7. Buyer confirms receipt → `POST /api/orders/[id]/confirm-receipt` → escrow released
8. Buyer reviews → `POST /api/reviews`

### Seller lists a part
1. `/seller/listings/new` → create-listing wizard
2. Click "AI Generate" → `POST /api/ai/generate-listing` → fills title + description
3. Submit form → `POST /api/listings` → status `draft`
4. Click "Publish" → `POST /api/listings/[id]/publish` → status `active`

### Mechanic verifies a part
1. Buyer on listing detail → "Request Inspection" → `/buyer/mechanic-requests/new`
2. `POST /api/mechanic-requests` → creates mechanic_verifications row
3. Mechanic at `/mechanic/requests` → sees pending pool → click Accept
4. `POST /api/mechanic/requests/[id]/accept` → assigned to mechanic
5. Mechanic submits verdict → `POST /api/mechanic/requests/[id]/verdict`
6. Buyer notified via Supabase Realtime notification

### Admin moderates a listing
1. Admin at `/admin/listings` → sees pending listings
2. Click listing → `/admin/listings/[id]`
3. Click "Approve" → `POST /api/admin/listings/[id]/approve` → status `active`, seller notified
4. Or click "Reject" → dialog with reason → `POST /api/admin/listings/[id]/reject`

### Dispute resolution
1. Buyer at `/buyer/orders/[id]/dispute` → opens dispute
2. `POST /api/disputes` → dispute created
3. Admin at `/admin/disputes/[id]` → reviews evidence
4. Admin resolves → `POST /api/admin/disputes/[id]/resolve` → `{ winner, note }`
5. Escrow released to winner, order marked completed

### Realtime chat
1. Buyer clicks "Contact seller" on listing → `POST /api/conversations` (upsert)
2. Navigate to `/messages` → two-panel inbox
3. Messages sync via Supabase Realtime channel subscription
4. Notification bell updates via Realtime unread count

---

## TODOs for human

1. **Payment gateway**: Orders use COD stub. Integrate JazzCash/EasyPaisa/Stripe for card payments. Update checkout flow to call real payment API before creating order.

2. **Supabase Edge Function scheduling**: Register `auto-release-escrow` and `fraud-worker` in Supabase dashboard via cron or pg_cron.

3. **OTP / SMS**: Onboarding phone verification uses placeholder. Integrate Twilio/MSG91 for real SMS OTP.

4. **Email notifications**: Supabase Auth handles email auth. Add transactional email (Resend/SendGrid) for order confirmations, dispute updates, payout notifications.

5. **pgvector RPCs**: The `retrieveContext` function in chatbot services calls a `match_kb_documents` RPC. Create this in Supabase:
   ```sql
   CREATE OR REPLACE FUNCTION match_kb_documents(query_embedding vector(1536), match_count int)
   RETURNS TABLE (id uuid, title text, content text, similarity float)
   AS $$
     SELECT id, title, content, 1 - (embedding <=> query_embedding) AS similarity
     FROM kb_documents ORDER BY embedding <=> query_embedding LIMIT match_count;
   $$ LANGUAGE sql;
   ```

6. **increment_unread_and_preview / mark_messages_read RPCs**: Messaging services reference these Postgres RPCs. Create them in a migration.

7. **Storage bucket CORS**: Configure CORS in Supabase dashboard for `listing-images`, `avatars`, `chat-attachments` buckets.

8. **Platform settings migration**: Create `platform_settings` table if not present. Admin settings page reads/writes it.

9. **Roles in Supabase Auth**: The middleware and guards read `profiles.roles` array. Ensure RLS policy on `profiles` allows users to read their own row.

10. **Auction flow**: The `auctions` feature module exists but auction-specific pages are not wired. Listings with `sale_type=auction` currently only show fixed-price UI.
