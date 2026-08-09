-- ============================================================================
-- Intelligence — ShopSmart ship-ready Phase 3
-- ============================================================================
--
-- Live fraud detection as an in-DB SQL function scheduled by pg_cron (same
-- pattern as auto_release_escrow in P1), so the admin fraud dashboard shows real,
-- scored signals with no edge-function/webhook plumbing. Writes the real
-- fraud_signals shape (subject_type/subject_id/signal_type/score/details/status)
-- and upserts on the (signal_type, subject_id) key added in P0.4.
--
-- Rules (INDEX §8.8 — rule 3 replaced; no listing_price_history table needed):
--   1. new_seller_high_price — seller <7 days old, active listing > 3x its
--      category median.
--   2. high_dispute_buyer    — buyer with > 3 disputes in the last 30 days.
--   3. price_outlier         — any active listing > 5x its category median.
-- Each writes a 0..1 score the admin UI colour-codes.


create or replace function public.detect_fraud_signals()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	v_open int;
begin
	-- Rule 1: new-seller price outlier.
	insert into public.fraud_signals (subject_type, subject_id, signal_type, score, details, status)
	select
		'listing', l.id, 'new_seller_high_price',
		least(1.0, round((l.price / nullif(m.median_price, 0))::numeric / 10, 2)),
		jsonb_build_object(
			'seller_id', l.user_id, 'price', l.price, 'category_median', m.median_price,
			'multiplier', round((l.price / nullif(m.median_price, 0))::numeric, 2)
		),
		'open'
	from public.listings l
	join public.profiles p on p.id = l.user_id and p.created_at > now() - interval '7 days'
	join (
		select category_id, percentile_cont(0.5) within group (order by price) as median_price
		from public.listings
		where status = 'active' and category_id is not null
		group by category_id
	) m on m.category_id = l.category_id
	where l.status = 'active' and m.median_price > 0 and l.price > m.median_price * 3
	on conflict (signal_type, subject_id) do nothing;

	-- Rule 2: high-dispute buyer.
	insert into public.fraud_signals (subject_type, subject_id, signal_type, score, details, status)
	select
		'user', d.opened_by, 'high_dispute_buyer',
		least(1.0, round(count(*)::numeric / 6, 2)),
		jsonb_build_object('dispute_count', count(*), 'window_days', 30),
		'open'
	from public.disputes d
	where d.created_at > now() - interval '30 days'
	group by d.opened_by
	having count(*) > 3
	on conflict (signal_type, subject_id) do nothing;

	-- Rule 3: general price outlier (replaces the listing_price_history rule).
	insert into public.fraud_signals (subject_type, subject_id, signal_type, score, details, status)
	select
		'listing', l.id, 'price_outlier',
		least(1.0, round((l.price / nullif(m.median_price, 0))::numeric / 12, 2)),
		jsonb_build_object(
			'price', l.price, 'category_median', m.median_price,
			'multiplier', round((l.price / nullif(m.median_price, 0))::numeric, 2)
		),
		'open'
	from public.listings l
	join (
		select category_id, percentile_cont(0.5) within group (order by price) as median_price
		from public.listings
		where status = 'active' and category_id is not null
		group by category_id
	) m on m.category_id = l.category_id
	where l.status = 'active' and m.median_price > 0 and l.price > m.median_price * 5
	on conflict (signal_type, subject_id) do nothing;

	select count(*) into v_open from public.fraud_signals where status = 'open';
	return v_open;
end;
$$;

revoke all on function public.detect_fraud_signals() from public;
grant execute on function public.detect_fraud_signals() to service_role;


-- Schedule hourly (offset from the escrow job), idempotently.
do $$
begin
	perform cron.unschedule('detect-fraud-signals');
exception
	when others then null;
end $$;

select cron.schedule('detect-fraud-signals', '15 * * * *', $cron$select public.detect_fraud_signals();$cron$);
