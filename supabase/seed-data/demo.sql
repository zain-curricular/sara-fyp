-- ============================================================================
-- ShopSmart — Demo Dataset (Phase 4)
-- ============================================================================
--
-- Procedurally generates a production-feeling dataset on top of the base
-- supabase/seed.sql: 50 sellers + stores, 80 buyers, 10 mechanics, ~550
-- listings with images, ~300 orders across every status with escrow + payouts,
-- reviews, conversations, notifications, disputes, and mechanic requests.
--
-- Runs on `supabase db reset` (wired via config.toml [db.seed] sql_paths) after
-- seed.sql, and is safe to re-run (ON CONFLICT on deterministic UUIDs).
--
-- Demo logins (all approved sellers): sellerN@demo.shopsmart.pk / Seller@123
--                        buyers:       buyerN@demo.shopsmart.pk  / Buyer@123
--                        mechanics:    mechN@demo.shopsmart.pk    / Mech@123
--
-- IMAGE SOURCING NOTE: listing images / avatars / logos use car-themed CDN URLs
-- (loremflickr.com, pravatar.cc) referenced directly in listing_images.url —
-- real, deterministic (?lock=), and needs internet at demo time. Uploading these
-- into Supabase Storage is a documented follow-up (see RUNBOOK).

alter table public.listings disable trigger enforce_listing_limit;

do $$
declare
	v_fnames    text[] := array['Imran','Tariq','Ali','Sara','Usman','Bilal','Ahmed','Fatima','Hassan','Ayesha','Kamran','Nadia','Faisal','Zainab','Omar','Hina','Saad','Maria','Junaid','Rabia'];
	v_lnames    text[] := array['Khan','Ahmed','Malik','Hussain','Raza','Sheikh','Butt','Chaudhry','Qureshi','Iqbal','Farooq','Javed','Aslam','Nawaz','Baig','Siddiqui','Abbasi','Zaidi','Dar','Mughal'];
	v_cities    text[] := array['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Hyderabad'];
	v_provinces text[] := array['Sindh','Punjab','Islamabad','Punjab','Punjab','Punjab','KPK','Sindh'];
	v_storeadj  text[] := array['AutoParts','Speed Motors','Genuine Parts','ProAuto','Mega Motors','Prime Parts','TurboTech','CarCare','AutoZone','Elite Spares'];
	v_vehicles  text[] := array['Suzuki Mehran','Suzuki Alto','Suzuki Cultus','Suzuki Swift','Suzuki Wagon R','Toyota Corolla','Toyota Vitz','Honda Civic','Honda City','Daihatsu Mira','Suzuki Bolan','Toyota Passo','Honda BR-V','KIA Sportage','Hyundai Tucson'];
	v_conds     text[] := array['new','like_new','excellent','good','fair'];
	v_lconds    text[] := array['oem','aftermarket','used','refurbished'];
	v_ptypes    text[] := array['Oil Filter','Brake Pads','Alternator','Air Filter','Radiator','Shock Absorber','Timing Chain Kit','Brake Disc','Piston Set','ECU','Fuel Filter','Ball Joint','Water Pump','Fuel Injectors','Ignition Coil','Front Bumper','Headlight','Clutch Plate','Wheel Bearing','Spark Plugs'];
	v_pcat_ids  uuid[];
	v_seller_ids uuid[] := '{}';
	v_store_ids  uuid[] := '{}';
	v_buyer_ids  uuid[] := '{}';
	v_mech_ids   uuid[] := '{}';
	v_lids       uuid[] := '{}';   -- active listing ids
	v_lids_sell  uuid[] := '{}';   -- their sellers
	v_lids_store uuid[] := '{}';   -- their stores
	v_lids_price numeric[] := '{}';
	v_lids_title text[] := '{}';
	v_uid uuid; v_sid uuid; v_lid uuid; v_oid uuid; v_cid uuid;
	i int; j int; k int; n int;
	v_email text; v_name text; v_city text; v_prov text; v_approval text;
	v_status text; v_price numeric; v_pcid uuid; v_veh text; v_ptype text;
	v_buyer uuid; v_seller uuid; v_store uuid; v_ss text;
	v_sub numeric; v_ship numeric; v_fee numeric; v_total numeric; v_payout numeric;
	v_placed timestamptz; v_active_count int;
begin
	select array_agg(id order by id) into v_pcat_ids from public.part_categories;

	-- ============ 50 SELLERS + STORES + 11 LISTINGS EACH ============
	for i in 1..50 loop
		v_uid := ('a5000000-0000-0000-0000-' || lpad(to_hex(i), 12, '0'))::uuid;
		v_seller_ids := v_seller_ids || v_uid;
		v_city := v_cities[1 + (i % 8)];
		v_prov := v_provinces[1 + (i % 8)];
		v_name := v_fnames[1 + (i % 20)] || ' ' || v_lnames[1 + ((i * 3) % 20)];
		v_email := 'seller' || i || '@demo.shopsmart.pk';

		insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
		values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, crypt('Seller@123', gen_salt('bf', 10)), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), false, false, now() - ((30 + i) || ' days')::interval, now())
		on conflict (id) do nothing;

		insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
		values (v_uid, v_uid, v_email, 'email', jsonb_build_object('sub', v_uid::text, 'email', v_email), now(), now(), now())
		on conflict (provider, provider_id) do nothing;

		insert into public.profiles (id, email, full_name, display_name, handle, city, bio, roles, active_role, role, is_verified, phone_verified, avatar_url, avg_rating, total_reviews)
		values (v_uid, v_email, v_name, v_name, 'seller_' || i, v_city, 'Trusted auto parts supplier in ' || v_city || '.', array['seller','buyer'], 'seller', 'seller', true, true, 'https://i.pravatar.cc/150?img=' || (i % 70), round((3.5 + random() * 1.5)::numeric, 1), (10 + (i * 7) % 90))
		on conflict (id) do nothing;

		-- Approval mix: 40 approved, 6 pending, 4 rejected.
		v_approval := case when i <= 40 then 'approved' when i <= 46 then 'pending' else 'rejected' end;
		v_sid := ('b5000000-0000-0000-0000-' || lpad(to_hex(i), 12, '0'))::uuid;
		v_store_ids := v_store_ids || v_sid;

		insert into public.seller_stores (id, owner_id, store_name, slug, city, description, verified, rating, review_count, approval_status, payout_details, logo_url)
		values (v_sid, v_uid, v_storeadj[1 + (i % 10)] || ' ' || v_city, 'store-' || i || '-' || lower(replace(v_city, ' ', '-')), v_city, 'Quality OEM & aftermarket spare parts. Fast dispatch across ' || v_prov || '.', v_approval = 'approved', round((3.5 + random() * 1.5)::numeric, 1), (10 + (i * 7) % 90), v_approval,
			case when v_approval = 'approved' then jsonb_build_object('method', 'bank_transfer', 'accountTitle', v_name, 'accountNumber', 'PK' || lpad((i * 137)::text, 20, '0'), 'bankName', 'HBL') else null end,
			'https://loremflickr.com/200/200/logo,garage?lock=' || i)
		on conflict (id) do nothing;

		for j in 1..11 loop
			k := (i - 1) * 11 + j;
			v_lid := ('c5000000-0000-0000-0000-' || lpad(to_hex(k), 12, '0'))::uuid;
			v_pcid := v_pcat_ids[1 + (k % array_length(v_pcat_ids, 1))];
			v_veh := v_vehicles[1 + (k % 15)];
			v_ptype := v_ptypes[1 + (k % 20)];
			v_price := (300 + (k % 40) * 250)::numeric;
			-- Status mix: some pending_review + rejected; approved stores mostly active.
			v_status := case
				when v_approval <> 'approved' then 'draft'
				when k % 40 = 0 then 'rejected'
				when k % 18 = 0 then 'pending_review'
				else 'active'
			end;

			insert into public.listings (id, user_id, platform, category_id, part_category_id, title, description, sale_type, price, compare_at_price, is_negotiable, condition, listing_condition, city, area, status, stock, store_id, is_wholesale, details, published_at, rejection_reason)
			values (v_lid, v_uid, 'automotive', 'cccccccc-0000-0000-0000-000000000001', v_pcid, v_veh || ' ' || v_ptype, 'Genuine-quality ' || v_ptype || ' for ' || v_veh || '. Inspected, ready to fit. Warranty available.', 'fixed', v_price, (v_price * 1.25)::numeric, (k % 2 = 0), v_conds[1 + (k % 5)]::public.item_condition, v_lconds[1 + (k % 4)], v_city, 'Auto Market', v_status::public.listing_status, 3 + (k % 50), v_sid, (k % 37 = 0), jsonb_build_object('brand', v_veh, 'part_type', v_ptype, 'warranty', '6 months'), now() - ((k % 60) || ' days')::interval,
				case when v_status = 'rejected' then 'Images unclear — please re-upload the part number.' else null end)
			on conflict (id) do nothing;

			insert into public.listing_images (listing_id, storage_path, url, position) values
				(v_lid, 'ext/' || k || '-1', 'https://loremflickr.com/600/400/car,auto,parts?lock=' || k, 0),
				(v_lid, 'ext/' || k || '-2', 'https://loremflickr.com/600/400/engine,mechanic?lock=' || (k + 900), 1)
			on conflict do nothing;

			if v_status = 'active' then
				v_lids := v_lids || v_lid;
				v_lids_sell := v_lids_sell || v_uid;
				v_lids_store := v_lids_store || v_sid;
				v_lids_price := v_lids_price || v_price;
				v_lids_title := v_lids_title || (v_veh || ' ' || v_ptype);
			end if;
		end loop;
	end loop;

	-- ============ 80 BUYERS ============
	for i in 1..80 loop
		v_uid := ('b0000000-0000-0000-0000-' || lpad(to_hex(i), 12, '0'))::uuid;
		v_buyer_ids := v_buyer_ids || v_uid;
		v_city := v_cities[1 + (i % 8)];
		v_prov := v_provinces[1 + (i % 8)];
		v_name := v_fnames[1 + ((i * 2) % 20)] || ' ' || v_lnames[1 + (i % 20)];
		v_email := 'buyer' || i || '@demo.shopsmart.pk';

		insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
		values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, crypt('Buyer@123', gen_salt('bf', 10)), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), false, false, now() - ((10 + i) || ' days')::interval, now())
		on conflict (id) do nothing;

		insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
		values (v_uid, v_uid, v_email, 'email', jsonb_build_object('sub', v_uid::text, 'email', v_email), now(), now(), now())
		on conflict (provider, provider_id) do nothing;

		insert into public.profiles (id, email, full_name, display_name, handle, city, roles, active_role, role, is_verified, phone_verified, is_banned, avatar_url, avg_rating, total_reviews)
		values (v_uid, v_email, v_name, v_name, 'buyer_' || i, v_city, array['buyer'], 'buyer', 'user', false, (i % 3 = 0), (i >= 79), 'https://i.pravatar.cc/150?img=' || ((i + 20) % 70), 0, 0)
		on conflict (id) do nothing;

		insert into public.saved_addresses (id, user_id, label, full_name, phone, address_line, city, province, is_default)
		values (('a1b20000-0000-0000-0000-' || lpad(to_hex(i), 12, '0'))::uuid, v_uid, 'Home', v_name, '+9230012' || lpad(i::text, 5, '0'), 'House ' || i || ', Block ' || (1 + i % 9) || ', ' || v_city, v_city, v_prov, true)
		on conflict (id) do nothing;
	end loop;

	-- ============ 10 MECHANICS ============
	for i in 1..10 loop
		v_uid := ('c0000000-0000-0000-0000-' || lpad(to_hex(i), 12, '0'))::uuid;
		v_mech_ids := v_mech_ids || v_uid;
		v_city := v_cities[1 + (i % 8)];
		v_name := v_fnames[1 + ((i * 4) % 20)] || ' ' || v_lnames[1 + ((i * 5) % 20)];
		v_email := 'mech' || i || '@demo.shopsmart.pk';

		insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
		values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, crypt('Mech@123', gen_salt('bf', 10)), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), false, false, now() - ((20 + i) || ' days')::interval, now())
		on conflict (id) do nothing;

		insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
		values (v_uid, v_uid, v_email, 'email', jsonb_build_object('sub', v_uid::text, 'email', v_email), now(), now(), now())
		on conflict (provider, provider_id) do nothing;

		insert into public.profiles (id, email, full_name, display_name, handle, city, bio, roles, active_role, role, is_verified, phone_verified, avatar_url, avg_rating, total_reviews)
		values (v_uid, v_email, v_name, v_name, 'mech_' || i, v_city, 'Certified mechanic — ' || v_city || '.', array['mechanic','buyer'], 'mechanic', 'user', (i <= 7), true, 'https://i.pravatar.cc/150?img=' || ((i + 40) % 70), round((4 + random())::numeric, 1), (i * 3))
		on conflict (id) do nothing;

		insert into public.mechanics (id, specialties, service_areas, hourly_rate, verified_at, total_jobs, rating)
		values (v_uid, array['Engine','Brakes','Electrical'], array[v_city, v_cities[1 + ((i + 1) % 8)]], 1500, case when i <= 7 then now() - (i || ' days')::interval else null end, (i * 5), round((4 + random())::numeric, 1))
		on conflict (id) do nothing;
	end loop;

	-- ============ ~300 ORDERS (every status) + items + escrow + payouts + reviews ============
	v_active_count := array_length(v_lids, 1);
	if v_active_count is not null and v_active_count > 0 then
		for n in 1..300 loop
			k := 1 + (n % v_active_count);
			v_lid := v_lids[k];
			v_seller := v_lids_sell[k];
			v_store := v_lids_store[k];
			v_price := v_lids_price[k];
			v_buyer := v_buyer_ids[1 + (n % 80)];
			if v_buyer = v_seller then v_buyer := v_buyer_ids[1 + ((n + 1) % 80)]; end if;

			v_sub := v_price;
			v_ship := 250;
			v_fee := round(v_sub * 0.03, 2);
			v_total := v_sub + v_ship + v_fee;
			v_payout := v_total - v_fee;
			v_placed := now() - ((n % 90) || ' days')::interval;
			v_oid := ('d5000000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid;

			-- Status distribution across the FSM.
			v_ss := case (n % 10)
				when 0 then 'completed' when 1 then 'completed' when 2 then 'completed' when 3 then 'completed'
				when 4 then 'delivered' when 5 then 'shipped' when 6 then 'accepted'
				when 7 then 'paid_escrow' when 8 then 'disputed' else 'cancelled' end;

			insert into public.orders (id, buyer_id, seller_id, store_id, payment_method, payment_ref, subtotal, shipping_fee, platform_fee, total, ss_status, status, order_number, shipping_address, placed_at, paid_at, accepted_at, shipped_at, delivered_at, completed_at, cancelled_at)
			values (v_oid, v_buyer, v_seller, v_store,
				(array['cod','card','jazzcash','easypaisa'])[1 + (n % 4)], 'demo_' || n,
				v_sub, v_ship, v_fee, v_total, v_ss,
				(case v_ss when 'completed' then 'completed' when 'cancelled' then 'cancelled' when 'refunded' then 'refunded' else 'payment_received' end)::public.order_status,
				'SS-DEMO-' || lpad(n::text, 5, '0'),
				jsonb_build_object('fullName', 'Demo Buyer', 'phone', '+923001234567', 'addressLine', 'House ' || n, 'city', 'Karachi', 'province', 'Sindh'),
				v_placed,
				case when v_ss <> 'cancelled' then v_placed else null end,
				case when v_ss in ('accepted','shipped','delivered','completed','disputed') then v_placed + interval '4 hours' else null end,
				case when v_ss in ('shipped','delivered','completed','disputed') then v_placed + interval '1 day' else null end,
				case when v_ss in ('delivered','completed','disputed') then v_placed + interval '3 days' else null end,
				case when v_ss = 'completed' then v_placed + interval '5 days' else null end,
				case when v_ss = 'cancelled' then v_placed + interval '2 hours' else null end)
			on conflict (id) do nothing;

			insert into public.order_items (order_id, listing_id, listing_snapshot, qty, unit_price, line_total)
			values (v_oid, v_lid, jsonb_build_object('title', v_lids_title[k], 'imageUrl', 'https://loremflickr.com/600/400/car,auto,parts?lock=' || k, 'condition', 'new'), 1, v_sub, v_sub)
			on conflict do nothing;

			-- Escrow for any order that reached payment.
			if v_ss <> 'cancelled' then
				insert into public.escrow_transactions (id, order_id, type, amount, payment_method, external_tx_id, ss_status, seller_payout, released_at, refunded_at)
				values (('e5000000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid, v_oid, 'hold', v_total,
					(array['cod','card','jazzcash','easypaisa'])[1 + (n % 4)]::public.payment_method, 'demo_' || n,
					case v_ss when 'completed' then 'released' when 'disputed' then 'disputed' else 'held' end,
					v_payout,
					case when v_ss = 'completed' then v_placed + interval '5 days' else null end, null)
				on conflict (id) do nothing;
			end if;

			-- Payout + review for completed orders.
			if v_ss = 'completed' then
				insert into public.payouts (seller_id, amount, period_start, period_end, status, method, order_id)
				values (v_seller, v_payout, (v_placed + interval '5 days')::date, (v_placed + interval '5 days')::date,
					case when n % 3 = 0 then 'paid' else 'pending' end, 'bank_transfer', v_oid)
				on conflict (order_id) do nothing;

				insert into public.reviews (reviewer_id, reviewed_user_id, order_id, listing_id, rating, comment)
				values (v_buyer, v_seller, v_oid, v_lid, 3 + (n % 3), (array['Genuine part, fast delivery!','Good quality, well packaged.','As described. Recommended seller.','Fits perfectly. Thanks!'])[1 + (n % 4)])
				on conflict (reviewer_id, order_id) do nothing;
			end if;

			-- Dispute rows for disputed orders.
			if v_ss = 'disputed' then
				insert into public.disputes (order_id, opened_by, reason, description, status, created_at)
				values (v_oid, v_buyer, (array['wrong_item','damaged','counterfeit'])[1 + (n % 3)], 'The part did not match the listing description.', case when n % 2 = 0 then 'open' else 'reviewing' end, v_placed + interval '4 days')
				on conflict do nothing;
			end if;

			-- A notification per order for the seller.
			insert into public.notifications (user_id, type, title, body, entity_type, entity_id, created_at)
			values (v_seller, 'order_status', 'Order ' || 'SS-DEMO-' || lpad(n::text, 5, '0'), 'Order is now ' || replace(v_ss, '_', ' ') || '.', 'order', v_oid, v_placed)
			on conflict do nothing;
		end loop;
	end if;

	-- ============ CONVERSATIONS + MESSAGES (60) ============
	if v_active_count is not null and v_active_count > 0 then
		for n in 1..60 loop
			k := 1 + ((n * 3) % v_active_count);
			v_lid := v_lids[k];
			v_seller := v_lids_sell[k];
			v_buyer := v_buyer_ids[1 + (n % 80)];
			if v_buyer = v_seller then v_buyer := v_buyer_ids[1 + ((n + 1) % 80)]; end if;
			v_cid := ('c04a0000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid;

			insert into public.conversations (id, listing_id, buyer_id, seller_id, last_message_at, last_message_preview, unread_count_seller)
			values (v_cid, v_lid, v_buyer, v_seller, now() - ((n % 20) || ' hours')::interval, 'Is this part still available?', 1)
			on conflict (id) do nothing;

			insert into public.messages (conversation_id, sender_id, content, created_at) values
				(v_cid, v_buyer, 'Assalam o Alaikum, is this part still available?', now() - ((n % 20) || ' hours')::interval - interval '5 minutes'),
				(v_cid, v_seller, 'Walaikum Assalam, yes it is in stock. Ready to dispatch.', now() - ((n % 20) || ' hours')::interval)
			on conflict do nothing;
		end loop;
	end if;

	-- ============ MECHANIC REQUESTS (24) ============
	if v_active_count is not null and v_active_count > 0 then
		for n in 1..24 loop
			k := 1 + ((n * 5) % v_active_count);
			v_lid := v_lids[k];
			v_buyer := v_buyer_ids[1 + (n % 80)];
			v_ss := (array['pending','assigned','verified_compatible','verified_incompatible'])[1 + (n % 4)];
			insert into public.mechanic_verifications (id, requester_id, listing_id, mechanic_id, status, mechanic_notes, fee, paid, responded_at, created_at)
			values (('7e510000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid, v_buyer, v_lid,
				case when v_ss = 'pending' then null else v_mech_ids[1 + (n % 7)] end, v_ss,
				case when v_ss like 'verified%' then 'Inspected the part — ' || (case when v_ss = 'verified_compatible' then 'genuine and fits the stated model. Recommended.' else 'NOT compatible with the stated model.' end) else null end,
				case when n % 3 = 0 then 1500 else 500 end,
				(v_ss like 'verified%'),
				case when v_ss like 'verified%' then now() - ((n % 10) || ' days')::interval else null end,
				now() - ((n % 15) || ' days')::interval)
			on conflict (id) do nothing;
		end loop;
	end if;

	-- ============ EXPLICIT FRAUD SIGNALS (12, all three types) ============
	if v_active_count is not null and v_active_count > 0 then
		for n in 1..12 loop
			v_status := (array['new_seller_high_price','price_outlier','high_dispute_buyer'])[1 + (n % 3)];
			insert into public.fraud_signals (subject_type, subject_id, signal_type, score, details, status)
			values (
				case when v_status = 'high_dispute_buyer' then 'user' else 'listing' end,
				case when v_status = 'high_dispute_buyer' then v_buyer_ids[1 + (n % 80)] else v_lids[1 + ((n * 7) % v_active_count)] end,
				v_status,
				round((0.4 + (n % 6) * 0.1)::numeric, 2),
				jsonb_build_object('note', 'Seeded demo signal for admin dashboard'),
				(array['open','open','actioned','dismissed'])[1 + (n % 4)]
			)
			on conflict (signal_type, subject_id) do nothing;
		end loop;
	end if;

end $$;

alter table public.listings enable trigger enforce_listing_limit;

-- Base-seed polish: approve the documented test sellers (seller1/seller2) with
-- payout details, and give the base listings images so the whole catalog shows
-- photos.
update public.seller_stores
set approval_status = 'approved',
	payout_details = jsonb_build_object('method', 'bank_transfer', 'accountTitle', 'Demo Seller', 'accountNumber', 'PK00DEMO0000000000001', 'bankName', 'HBL')
where id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');

insert into public.listing_images (listing_id, storage_path, url, position)
select l.id, 'ext/base-' || l.id, 'https://loremflickr.com/600/400/car,auto,parts?lock=' || (abs(hashtext(l.id::text)) % 5000), 0
from public.listings l
where l.id::text like 'cccccccc-1111-%' or l.id::text like 'cccccccc-2222-%'
on conflict do nothing;

-- Generate fraud signals from the seeded catalog/disputes.
select public.detect_fraud_signals();
