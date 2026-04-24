-- ============================================================================
-- ShopSmart — Seed Data
-- ============================================================================
--
-- Applied automatically by `supabase db reset`.
-- Contains test users, stores, listings, orders, reviews, KB docs,
-- and platform settings for full end-to-end development testing.
--
-- Test Accounts
-- -------------
-- admin@shopsmart.pk     / Admin@123   (admin + buyer)
-- seller1@shopsmart.pk   / Seller@123  (seller + buyer) — AutoParts Karachi
-- seller2@shopsmart.pk   / Seller@123  (seller + buyer) — Speed Parts Lahore
-- buyer1@shopsmart.pk    / Buyer@123   (buyer)
-- buyer2@shopsmart.pk    / Buyer@123   (buyer)
-- mechanic@shopsmart.pk  / Mech@123    (mechanic + buyer)


-- ============================================================================
-- 0. Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================================
-- 1. Auth Users
-- ============================================================================

-- Fixed UUIDs for reproducibility
DO $$
DECLARE
  v_admin_id    uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_seller1_id  uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_seller2_id  uuid := 'aaaaaaaa-0000-0000-0000-000000000003';
  v_buyer1_id   uuid := 'aaaaaaaa-0000-0000-0000-000000000004';
  v_buyer2_id   uuid := 'aaaaaaaa-0000-0000-0000-000000000005';
  v_mechanic_id uuid := 'aaaaaaaa-0000-0000-0000-000000000006';
BEGIN

  -- Auth users — insert or update so reset is idempotent
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data,
    is_sso_user, is_anonymous,
    created_at, updated_at
  ) VALUES
    (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@shopsmart.pk',
      crypt('Admin@123', gen_salt('bf', 10)),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub',v_admin_id::text,'email','admin@shopsmart.pk','email_verified',true,'phone_verified',false),
      false, false, now(), now()
    ),
    (
      v_seller1_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'seller1@shopsmart.pk',
      crypt('Seller@123', gen_salt('bf', 10)),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub',v_seller1_id::text,'email','seller1@shopsmart.pk','email_verified',true,'phone_verified',false),
      false, false, now(), now()
    ),
    (
      v_seller2_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'seller2@shopsmart.pk',
      crypt('Seller@123', gen_salt('bf', 10)),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub',v_seller2_id::text,'email','seller2@shopsmart.pk','email_verified',true,'phone_verified',false),
      false, false, now(), now()
    ),
    (
      v_buyer1_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'buyer1@shopsmart.pk',
      crypt('Buyer@123', gen_salt('bf', 10)),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub',v_buyer1_id::text,'email','buyer1@shopsmart.pk','email_verified',true,'phone_verified',false),
      false, false, now(), now()
    ),
    (
      v_buyer2_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'buyer2@shopsmart.pk',
      crypt('Buyer@123', gen_salt('bf', 10)),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub',v_buyer2_id::text,'email','buyer2@shopsmart.pk','email_verified',true,'phone_verified',false),
      false, false, now(), now()
    ),
    (
      v_mechanic_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'mechanic@shopsmart.pk',
      crypt('Mech@123', gen_salt('bf', 10)),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub',v_mechanic_id::text,'email','mechanic@shopsmart.pk','email_verified',true,'phone_verified',false),
      false, false, now(), now()
    )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    instance_id = EXCLUDED.instance_id,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    updated_at = now();


  -- ============================================================================
  -- 2. Profiles
  -- ============================================================================

  INSERT INTO public.profiles (
    id, email, full_name, display_name, handle,
    city, bio, roles, active_role, role,
    is_verified, phone_verified, avg_rating, total_reviews
  ) VALUES
    (
      v_admin_id, 'admin@shopsmart.pk', 'Admin User', 'Admin', 'admin_ss',
      'Karachi', 'Platform administrator.',
      ARRAY['admin','buyer'], 'admin', 'admin',
      true, true, 0, 0
    ),
    (
      v_seller1_id, 'seller1@shopsmart.pk', 'Imran Khan', 'AutoParts KHI', 'imran_autoparts',
      'Karachi', 'Your trusted supplier of genuine OEM and aftermarket spare parts in Karachi.',
      ARRAY['seller','buyer'], 'seller', 'seller',
      true, true, 4.7, 23
    ),
    (
      v_seller2_id, 'seller2@shopsmart.pk', 'Tariq Mehmood', 'Speed Parts LHR', 'tariq_speedparts',
      'Lahore', 'Fast delivery of quality auto parts across Punjab.',
      ARRAY['seller','buyer'], 'seller', 'seller',
      true, true, 4.4, 18
    ),
    (
      v_buyer1_id, 'buyer1@shopsmart.pk', 'Ali Hassan', 'Ali H', 'ali_hassan',
      'Karachi', 'Car enthusiast.',
      ARRAY['buyer'], 'buyer', 'user',
      false, false, 0, 0
    ),
    (
      v_buyer2_id, 'buyer2@shopsmart.pk', 'Sara Ahmed', 'Sara A', 'sara_ahmed',
      'Lahore', NULL,
      ARRAY['buyer'], 'buyer', 'user',
      false, false, 0, 0
    ),
    (
      v_mechanic_id, 'mechanic@shopsmart.pk', 'Usman Ghani', 'Usman Ghani', 'usman_mechanic',
      'Karachi', 'Certified mechanic with 10 years of experience in Japanese vehicles.',
      ARRAY['mechanic','buyer'], 'mechanic', 'user',
      true, true, 4.8, 12
    )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    handle = EXCLUDED.handle,
    city = EXCLUDED.city,
    bio = EXCLUDED.bio,
    roles = EXCLUDED.roles,
    active_role = EXCLUDED.active_role,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews;


  -- ============================================================================
  -- 3. Auth Identities (needed for Supabase Auth email login)
  -- ============================================================================

  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES
    (
      v_admin_id, v_admin_id,
      'admin@shopsmart.pk', 'email',
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@shopsmart.pk'),
      now(), now(), now()
    ),
    (
      v_seller1_id, v_seller1_id,
      'seller1@shopsmart.pk', 'email',
      jsonb_build_object('sub', v_seller1_id::text, 'email', 'seller1@shopsmart.pk'),
      now(), now(), now()
    ),
    (
      v_seller2_id, v_seller2_id,
      'seller2@shopsmart.pk', 'email',
      jsonb_build_object('sub', v_seller2_id::text, 'email', 'seller2@shopsmart.pk'),
      now(), now(), now()
    ),
    (
      v_buyer1_id, v_buyer1_id,
      'buyer1@shopsmart.pk', 'email',
      jsonb_build_object('sub', v_buyer1_id::text, 'email', 'buyer1@shopsmart.pk'),
      now(), now(), now()
    ),
    (
      v_buyer2_id, v_buyer2_id,
      'buyer2@shopsmart.pk', 'email',
      jsonb_build_object('sub', v_buyer2_id::text, 'email', 'buyer2@shopsmart.pk'),
      now(), now(), now()
    ),
    (
      v_mechanic_id, v_mechanic_id,
      'mechanic@shopsmart.pk', 'email',
      jsonb_build_object('sub', v_mechanic_id::text, 'email', 'mechanic@shopsmart.pk'),
      now(), now(), now()
    )
  ON CONFLICT (provider, provider_id) DO NOTHING;


  -- ============================================================================
  -- 4. Seller Stores
  -- ============================================================================

  INSERT INTO public.seller_stores (
    id, owner_id, store_name, slug, city, description, verified, rating, review_count
  ) VALUES
    (
      'bbbbbbbb-0000-0000-0000-000000000001',
      v_seller1_id,
      'AutoParts Karachi',
      'autoparts-karachi',
      'Karachi',
      'Genuine OEM and quality aftermarket spare parts for all Japanese and Korean vehicles. Serving Karachi since 2010.',
      true, 4.7, 23
    ),
    (
      'bbbbbbbb-0000-0000-0000-000000000002',
      v_seller2_id,
      'Speed Parts Lahore',
      'speed-parts-lahore',
      'Lahore',
      'Fast delivery of engine, brake, and electrical parts across Punjab. 15,000+ SKUs in stock.',
      true, 4.4, 18
    )
  ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    verified = EXCLUDED.verified,
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count;


  -- ============================================================================
  -- 5. Mechanic Profile
  -- ============================================================================

  INSERT INTO public.mechanics (
    id, specialties, service_areas, hourly_rate, verified_at, total_jobs, rating
  ) VALUES
    (
      v_mechanic_id,
      ARRAY['Engine','Brakes','Electrical','Suspension'],
      ARRAY['Karachi','Hyderabad'],
      1500.00,
      now(),
      47,
      4.8
    )
  ON CONFLICT (id) DO UPDATE SET
    specialties = EXCLUDED.specialties,
    service_areas = EXCLUDED.service_areas,
    hourly_rate = EXCLUDED.hourly_rate,
    verified_at = EXCLUDED.verified_at,
    total_jobs = EXCLUDED.total_jobs,
    rating = EXCLUDED.rating;

END $$;


-- ============================================================================
-- 6. Listings
-- ============================================================================
--
-- Disable the listing-limit trigger so seed data bypasses subscription quotas.

ALTER TABLE public.listings DISABLE TRIGGER enforce_listing_limit;

-- Listings need a category_id referencing public.categories (platform catalog).
INSERT INTO public.categories (id, name, platform, slug)
VALUES (
  'cccccccc-0000-0000-0000-000000000001',
  'Spare Parts',
  'automotive',
  'spare-parts'
)
ON CONFLICT (id) DO NOTHING;

-- Insert listings using slug-based lookups for part_category_id (generated UUIDs).
DO $$
DECLARE
  v_cat_id      uuid := 'cccccccc-0000-0000-0000-000000000001';
  v_s1          uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_s2          uuid := 'aaaaaaaa-0000-0000-0000-000000000003';
  v_store1      uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  v_store2      uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  v_pc_engine   uuid;
  v_pc_brakes   uuid;
  v_pc_filters  uuid;
  v_pc_elec     uuid;
  v_pc_susp     uuid;
  v_pc_cool     uuid;
  v_pc_fuel     uuid;
  v_pc_body     uuid;
BEGIN

  SELECT id INTO v_pc_engine  FROM part_categories WHERE slug = 'engine'       LIMIT 1;
  SELECT id INTO v_pc_brakes  FROM part_categories WHERE slug = 'brakes'       LIMIT 1;
  SELECT id INTO v_pc_filters FROM part_categories WHERE slug = 'filters'      LIMIT 1;
  SELECT id INTO v_pc_elec    FROM part_categories WHERE slug = 'electrical'   LIMIT 1;
  SELECT id INTO v_pc_susp    FROM part_categories WHERE slug = 'suspension'   LIMIT 1;
  SELECT id INTO v_pc_cool    FROM part_categories WHERE slug = 'cooling'      LIMIT 1;
  SELECT id INTO v_pc_fuel    FROM part_categories WHERE slug = 'fuel-system'  LIMIT 1;
  SELECT id INTO v_pc_body    FROM part_categories WHERE slug = 'body'         LIMIT 1;

  -- ── Seller 1 (AutoParts Karachi) ───────────────────────────────────────────

  INSERT INTO public.listings (
    id, user_id, platform, category_id, part_category_id,
    title, description, sale_type, price, compare_at_price, is_negotiable,
    condition, listing_condition, city, area, status, stock, store_id,
    details, published_at
  ) VALUES
    ('cccccccc-1111-0000-0000-000000000001', v_s1, 'automotive', v_cat_id, v_pc_engine,
     'Suzuki Mehran Engine Oil Filter — OEM',
     'Original Suzuki Mehran engine oil filter. Fits 1989–2012 models. Ensures clean oil circulation.',
     'fixed', 350.00, 450.00, true, 'new', 'oem',
     'Karachi', 'SITE Area', 'active', 50, v_store1,
     '{"brand":"Suzuki","part_number":"16510-82703","warranty":"6 months"}'::jsonb,
     now() - interval '10 days'),

    ('cccccccc-1111-0000-0000-000000000002', v_s1, 'automotive', v_cat_id, v_pc_brakes,
     'Suzuki Mehran Brake Pads — Front (Set of 4)',
     'High-quality ceramic front brake pads for Suzuki Mehran. Superior stopping power, low dust.',
     'fixed', 1200.00, 1600.00, false, 'new', 'aftermarket',
     'Karachi', 'SITE Area', 'active', 30, v_store1,
     '{"brand":"DBA","axle":"front","material":"ceramic"}'::jsonb,
     now() - interval '9 days'),

    ('cccccccc-1111-0000-0000-000000000003', v_s1, 'automotive', v_cat_id, v_pc_elec,
     'Suzuki Swift Alternator 12V 65A — Reconditioned',
     'Professionally reconditioned alternator for Suzuki Swift 2005–2010. Tested under load. 3-month warranty.',
     'fixed', 4500.00, NULL, true, 'good', 'refurbished',
     'Karachi', 'Korangi Industrial', 'active', 5, v_store1,
     '{"voltage":"12V","amperage":"65A","warranty":"3 months"}'::jsonb,
     now() - interval '8 days'),

    ('cccccccc-1111-0000-0000-000000000004', v_s1, 'automotive', v_cat_id, v_pc_filters,
     'Suzuki Alto Air Filter — OEM Replacement',
     'OEM-grade air filter for Suzuki Alto 660cc and 1000cc. Replace every 15,000 km.',
     'fixed', 280.00, 350.00, false, 'new', 'aftermarket',
     'Karachi', 'SITE Area', 'active', 100, v_store1,
     '{"compatible_with":"Alto 660cc/1000cc","replacement_interval":"15,000 km"}'::jsonb,
     now() - interval '7 days'),

    ('cccccccc-1111-0000-0000-000000000005', v_s1, 'automotive', v_cat_id, v_pc_cool,
     'Suzuki Cultus Radiator — Aluminium Core',
     'All-aluminium radiator for Suzuki Cultus G13BB. Drop-in replacement. Improved cooling capacity.',
     'fixed', 6500.00, 8000.00, true, 'new', 'aftermarket',
     'Karachi', 'Korangi Industrial', 'active', 8, v_store1,
     '{"material":"aluminium","rows":"2","compatible_engine":"G13BB"}'::jsonb,
     now() - interval '6 days'),

    ('cccccccc-1111-0000-0000-000000000006', v_s1, 'automotive', v_cat_id, v_pc_susp,
     'Suzuki Mehran Shock Absorber — Rear Pair',
     'Original-spec rear shock absorbers for Suzuki Mehran. Restores ride comfort. Sold as a pair.',
     'fixed', 3200.00, NULL, true, 'new', 'aftermarket',
     'Karachi', 'SITE Area', 'active', 12, v_store1,
     '{"position":"rear","sold_as":"pair","compatible":"Mehran 1989-2012"}'::jsonb,
     now() - interval '5 days'),

    ('cccccccc-1111-0000-0000-000000000007', v_s1, 'automotive', v_cat_id, v_pc_engine,
     'Suzuki Swift Timing Chain Kit — Complete Set',
     'Complete timing chain kit for Swift 1.3 M13A engine. Includes chain, tensioner, and guides.',
     'fixed', 8500.00, 10000.00, false, 'new', 'oem',
     'Karachi', 'SITE Area', 'active', 6, v_store1,
     '{"engine":"M13A","includes":"chain,tensioner,guides"}'::jsonb,
     now() - interval '4 days'),

    ('cccccccc-1111-0000-0000-000000000008', v_s1, 'automotive', v_cat_id, v_pc_brakes,
     'Suzuki Alto Brake Disc Rotors — Front Pair',
     'Vented front brake disc rotors for Suzuki Alto 2019+. Cross-drilled. Sold as a pair.',
     'fixed', 2800.00, NULL, true, 'new', 'aftermarket',
     'Karachi', 'SITE Area', 'active', 15, v_store1,
     '{"position":"front","type":"vented cross-drilled","sold_as":"pair"}'::jsonb,
     now() - interval '3 days'),

  -- ── Seller 2 (Speed Parts Lahore) ──────────────────────────────────────────

    ('cccccccc-2222-0000-0000-000000000001', v_s2, 'automotive', v_cat_id, v_pc_engine,
     'Suzuki Alto 660cc Engine Piston Set — STD Size',
     'Standard piston set for Alto 660cc 3-cylinder. Includes rings and pins. Engine rebuild ready.',
     'fixed', 5500.00, 7000.00, true, 'new', 'oem',
     'Lahore', 'Township', 'active', 10, v_store2,
     '{"size":"STD","cylinders":"3","includes":"rings,pins","engine":"F6A"}'::jsonb,
     now() - interval '12 days'),

    ('cccccccc-2222-0000-0000-000000000002', v_s2, 'automotive', v_cat_id, v_pc_elec,
     'Suzuki Swift ECU — 1.3 M13A Engine Control Unit',
     'Used OEM ECU for Swift 1.3 M13A, matched and tested. Programming included.',
     'fixed', 12000.00, NULL, true, 'fair', 'used',
     'Lahore', 'Township', 'active', 2, v_store2,
     '{"part_number":"33920-68K12","engine":"M13A","programming":"included"}'::jsonb,
     now() - interval '11 days'),

    ('cccccccc-2222-0000-0000-000000000003', v_s2, 'automotive', v_cat_id, v_pc_filters,
     'Suzuki Cultus Fuel Filter — OEM',
     'OEM fuel filter for Suzuki Cultus G13BB. Keeps injectors clean. Replace every 20,000 km.',
     'fixed', 420.00, 520.00, false, 'new', 'oem',
     'Lahore', 'Township', 'active', 60, v_store2,
     '{"part_number":"15410-60B01","interval":"20,000 km"}'::jsonb,
     now() - interval '10 days'),

    ('cccccccc-2222-0000-0000-000000000004', v_s2, 'automotive', v_cat_id, v_pc_susp,
     'Suzuki Cultus Ball Joint — Lower Front (Pair)',
     'Heavy-duty lower front ball joints for Suzuki Cultus. Sold as a pair.',
     'fixed', 1800.00, 2200.00, true, 'new', 'aftermarket',
     'Lahore', 'Township', 'active', 20, v_store2,
     '{"position":"lower front","sold_as":"pair","material":"forged steel"}'::jsonb,
     now() - interval '9 days'),

    ('cccccccc-2222-0000-0000-000000000005', v_s2, 'automotive', v_cat_id, v_pc_cool,
     'Suzuki Mehran Water Pump — OEM Quality',
     'OEM-quality water pump for Suzuki Mehran F10A/F10D. Prevents overheating.',
     'fixed', 2200.00, NULL, true, 'new', 'aftermarket',
     'Lahore', 'Township', 'active', 15, v_store2,
     '{"compatible_engine":"F10A,F10D","warranty":"1 year"}'::jsonb,
     now() - interval '8 days'),

    ('cccccccc-2222-0000-0000-000000000006', v_s2, 'automotive', v_cat_id, v_pc_fuel,
     'Suzuki Alto Fuel Injectors — Set of 3',
     'Rebuilt and flow-tested fuel injectors for Alto 660cc. Set of 3.',
     'fixed', 3600.00, 4500.00, true, 'good', 'refurbished',
     'Lahore', 'Township', 'active', 7, v_store2,
     '{"quantity":"3","flow_tested":"yes","warranty":"6 months"}'::jsonb,
     now() - interval '7 days'),

    ('cccccccc-2222-0000-0000-000000000007', v_s2, 'automotive', v_cat_id, v_pc_elec,
     'Suzuki Mehran Ignition Coil — OEM Replacement',
     'Direct OEM replacement ignition coil for Suzuki Mehran. Eliminates misfires.',
     'fixed', 950.00, 1200.00, false, 'new', 'aftermarket',
     'Lahore', 'Township', 'active', 25, v_store2,
     '{"compatible":"Mehran 1989-2012","ohms":"0.9-1.1"}'::jsonb,
     now() - interval '6 days'),

    ('cccccccc-2222-0000-0000-000000000008', v_s2, 'automotive', v_cat_id, v_pc_body,
     'Suzuki Swift Front Bumper — 2005–2010 (Black)',
     'Aftermarket front bumper for Swift 2005–2010. Unpainted black PP plastic. Ready for paint.',
     'fixed', 4200.00, 5500.00, true, 'new', 'aftermarket',
     'Lahore', 'Township', 'active', 4, v_store2,
     '{"color":"black unpainted","material":"PP plastic"}'::jsonb,
     now() - interval '5 days')

  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    status = EXCLUDED.status,
    stock = EXCLUDED.stock;

END $$;

ALTER TABLE public.listings ENABLE TRIGGER enforce_listing_limit;


-- ============================================================================
-- 7. Sample Orders (completed — for reviews to reference)
-- ============================================================================

INSERT INTO public.orders (
  id, listing_id, buyer_id, seller_id, store_id,
  amount, subtotal, shipping_fee, platform_fee, total,
  ss_status, status,
  order_number, shipping_address,
  placed_at, accepted_at, shipped_at, delivered_at, completed_at
) VALUES
  (
    'dddddddd-0000-0000-0000-000000000001',
    'cccccccc-1111-0000-0000-000000000001', -- Oil Filter
    'aaaaaaaa-0000-0000-0000-000000000004', -- buyer1
    'aaaaaaaa-0000-0000-0000-000000000002', -- seller1
    'bbbbbbbb-0000-0000-0000-000000000001',
    350.00, 350.00, 150.00, 17.50, 517.50,
    'completed', 'completed',
    'SS-20260001',
    '{"name":"Ali Hassan","phone":"+923001234567","address":"House 12, Block 3, North Karachi","city":"Karachi"}'::jsonb,
    now() - interval '8 days',
    now() - interval '7 days 20 hours',
    now() - interval '7 days',
    now() - interval '5 days',
    now() - interval '4 days'
  ),
  (
    'dddddddd-0000-0000-0000-000000000002',
    'cccccccc-2222-0000-0000-000000000003', -- Fuel Filter
    'aaaaaaaa-0000-0000-0000-000000000005', -- buyer2
    'aaaaaaaa-0000-0000-0000-000000000003', -- seller2
    'bbbbbbbb-0000-0000-0000-000000000002',
    420.00, 420.00, 200.00, 21.00, 641.00,
    'completed', 'completed',
    'SS-20260002',
    '{"name":"Sara Ahmed","phone":"+923009876543","address":"Flat 5B, DHA Phase 4","city":"Lahore"}'::jsonb,
    now() - interval '6 days',
    now() - interval '5 days 22 hours',
    now() - interval '5 days',
    now() - interval '3 days',
    now() - interval '2 days'
  ),
  -- In-progress order
  (
    'dddddddd-0000-0000-0000-000000000003',
    'cccccccc-1111-0000-0000-000000000002', -- Brake Pads
    'aaaaaaaa-0000-0000-0000-000000000004', -- buyer1
    'aaaaaaaa-0000-0000-0000-000000000002', -- seller1
    'bbbbbbbb-0000-0000-0000-000000000001',
    1200.00, 1200.00, 150.00, 60.00, 1410.00,
    'accepted', 'payment_received',
    'SS-20260003',
    '{"name":"Ali Hassan","phone":"+923001234567","address":"House 12, Block 3, North Karachi","city":"Karachi"}'::jsonb,
    now() - interval '2 days',
    now() - interval '1 day 20 hours',
    NULL, NULL, NULL
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 8. Reviews (only on completed orders)
-- ============================================================================

INSERT INTO public.reviews (
  id, reviewer_id, reviewed_user_id, order_id, listing_id, rating, comment
) VALUES
  (
    'eeeeeeee-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004', -- buyer1
    'aaaaaaaa-0000-0000-0000-000000000002', -- seller1
    'dddddddd-0000-0000-0000-000000000001',
    'cccccccc-1111-0000-0000-000000000001',
    5,
    'Original part, fast dispatch, well packaged. Will buy again!'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000005', -- buyer2
    'aaaaaaaa-0000-0000-0000-000000000003', -- seller2
    'dddddddd-0000-0000-0000-000000000002',
    'cccccccc-2222-0000-0000-000000000003',
    4,
    'Good quality fuel filter. Delivery took a day longer than expected but product is genuine.'
  )
ON CONFLICT (reviewer_id, order_id) DO NOTHING;


-- ============================================================================
-- 9. Favorites
-- ============================================================================

INSERT INTO public.favorites (user_id, listing_id)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000004', 'cccccccc-2222-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'cccccccc-1111-0000-0000-000000000005'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'cccccccc-1111-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'cccccccc-2222-0000-0000-000000000008')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 10. Knowledge Base Documents (AI Chatbot)
-- ============================================================================

INSERT INTO public.kb_documents (id, title, source, content, metadata) VALUES
  (
    'ffffffff-0000-0000-0000-000000000001',
    'How to buy on ShopSmart',
    'help-center',
    'To buy a spare part on ShopSmart: 1) Search or browse for your part. 2) Click the listing to view details. 3) Click "Add to Cart". 4) Go to Cart and click Checkout. 5) Enter your shipping address. 6) Confirm your order. Your order will be placed and the seller will be notified. You can track your order status in My Orders.',
    '{"category":"buying","topic":"checkout"}'::jsonb
  ),
  (
    'ffffffff-0000-0000-0000-000000000002',
    'How to sell on ShopSmart',
    'help-center',
    'To sell spare parts on ShopSmart: 1) Click "Become a Seller" and complete store setup. 2) Go to Seller Dashboard > Listings > New Listing. 3) Fill in part title, category, compatible vehicles, price, condition, and photos. 4) Use AI Generate to auto-fill description. 5) Click Publish. Your listing goes live after admin approval. Manage orders from the Orders section.',
    '{"category":"selling","topic":"listing"}'::jsonb
  ),
  (
    'ffffffff-0000-0000-0000-000000000003',
    'ShopSmart Escrow & Payment Policy',
    'help-center',
    'ShopSmart uses an escrow system to protect both buyers and sellers. When you place an order, your payment is held securely. The seller ships the part. Once you confirm receipt, the payment is released to the seller. If you have a problem, you can open a dispute within 7 days of delivery. Our team will review and resolve it fairly. COD (Cash on Delivery) is also available in selected cities.',
    '{"category":"payments","topic":"escrow"}'::jsonb
  ),
  (
    'ffffffff-0000-0000-0000-000000000004',
    'Mechanic Inspection Service',
    'help-center',
    'Not sure if a used part is genuine? Request a Mechanic Inspection. On any listing page, click "Request Inspection". A verified ShopSmart mechanic will inspect the part and submit a detailed report. Inspection costs Rs. 500 for standard parts and Rs. 1,500 for engines or gearboxes. Results are shared within 24–48 hours.',
    '{"category":"inspection","topic":"mechanic"}'::jsonb
  ),
  (
    'ffffffff-0000-0000-0000-000000000005',
    'Compatible Vehicles for Suzuki Mehran Parts',
    'catalog',
    'Suzuki Mehran (1989–2012) uses F10A (800cc) and F10D (800cc EFI) engines. Common compatible parts: oil filter part number 16510-82703, air filter 13780-82070, spark plugs NGK BPR6ES, brake shoes 53200-82030. Many Suzuki Alto F6A parts are NOT directly compatible with Mehran. Always verify part numbers before purchasing.',
    '{"category":"catalog","vehicle":"Suzuki Mehran"}'::jsonb
  ),
  (
    'ffffffff-0000-0000-0000-000000000006',
    'How to check if a part number is OEM',
    'catalog',
    'OEM (Original Equipment Manufacturer) parts have a manufacturer part number stamped or printed on them. For Suzuki vehicles, the part number usually appears as a series like "16510-82703". You can cross-reference this with the Suzuki parts catalogue or use the ShopSmart part number search. OEM parts listed on ShopSmart are verified by our team. Sellers must provide photo evidence of the part number.',
    '{"category":"catalog","topic":"oem verification"}'::jsonb
  ),
  (
    'ffffffff-0000-0000-0000-000000000007',
    'Return and Refund Policy',
    'help-center',
    'ShopSmart offers a 7-day return window from delivery date. To return: open a dispute from your order detail page, select "Wrong Part" or "Defective Part", and upload photos. If your return is approved, the seller arranges pickup and refund is processed within 3–5 business days. Non-returnable items: electrical components (ECU, sensors) once installed, and consumables (oils, fluids).',
    '{"category":"returns","topic":"refund"}'::jsonb
  ),
  (
    'ffffffff-0000-0000-0000-000000000008',
    'Delivery Times and Shipping Rates',
    'help-center',
    'Standard shipping across Pakistan: 3–5 business days. Express shipping (Karachi, Lahore, Islamabad): 1–2 business days for Rs. 350. Shipping rates: up to 1kg Rs. 150, 1–5kg Rs. 250, above 5kg calculated by weight. Sellers in Karachi and Lahore typically dispatch same day if order is placed before 2 PM. Track your shipment in My Orders using the tracking number.',
    '{"category":"shipping","topic":"delivery"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 11. Platform Settings
-- ============================================================================

INSERT INTO public.platform_settings (key, value) VALUES
  ('platform_name',         'ShopSmart'),
  ('platform_tagline',      'Pakistan''s No.1 Auto Parts Marketplace'),
  ('platform_fee_percent',  '5'),
  ('escrow_release_days',   '7'),
  ('max_listings_per_seller', '200'),
  ('min_withdrawal_amount', '500'),
  ('support_email',         'support@shopsmart.pk'),
  ('support_phone',         '+92-21-1234567'),
  ('whatsapp_number',       '+923001234567'),
  ('maintenance_mode',      'false'),
  ('allow_new_registrations', 'true'),
  ('featured_cities',       'Karachi,Lahore,Islamabad,Rawalpindi,Faisalabad,Multan'),
  ('cod_cities',            'Karachi,Lahore,Islamabad'),
  ('currency',              'PKR'),
  ('currency_symbol',       'Rs.'),
  ('inspection_fee_standard', '500'),
  ('inspection_fee_engine',   '1500'),
  ('seller_verification_required', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ============================================================================
-- 12. Saved Addresses
-- ============================================================================

INSERT INTO public.saved_addresses (
  id, user_id, label, full_name, phone, address_line,
  city, province, is_default
) VALUES
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Home',
    'Ali Hassan',
    '+923001234567',
    'House 12 Block 3 North Karachi',
    'Karachi',
    'Sindh',
    true
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'Home',
    'Sara Ahmed',
    '+923009876543',
    'Flat 5B DHA Phase 4',
    'Lahore',
    'Punjab',
    true
  )
ON CONFLICT (id) DO NOTHING;
