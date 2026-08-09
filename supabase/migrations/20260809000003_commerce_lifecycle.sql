-- ============================================================================
-- Commerce Lifecycle — ShopSmart ship-ready Phase 1
-- ============================================================================
--
-- Everything the live commerce flow needs beyond the P0 reconciliation:
--   * orders.payment_method / payment_ref  — persist what the buyer paid with
--     (sandbox or Stripe test mode) and the gateway reference.
--   * payouts.order_id (+ unique)          — one payout per released order, so
--     the money identity holds and re-runs are idempotent.
--   * notification_type enum members       — payment/delivery/escrow/payout pings.
--   * create_payout_for_order()            — single source of truth for payout
--     creation, called from confirm-receipt, dispute resolution, the auto-release
--     edge function, and the SQL cron below.
--   * auto_release_escrow() + pg_cron      — 7-day auto-release runs in-DB daily.
--
-- Additive only. Decisions: INDEX §8.1/§8.2 (pay at checkout, sandbox/Stripe),
-- §8.5 (seller marks delivered; 7-day auto-release backstop).


-- ----------------------------------------------------------------------------
-- 1.1 — Payment persistence on orders
-- ----------------------------------------------------------------------------

alter table public.orders
	add column if not exists payment_method text not null default 'cod';

alter table public.orders
	add column if not exists payment_ref text;


-- ----------------------------------------------------------------------------
-- 1.4 — Payout <-> order linkage (one payout per released order)
-- ----------------------------------------------------------------------------

alter table public.payouts
	add column if not exists order_id uuid references public.orders (id) on delete set null;

-- Full (non-partial) unique index so `insert ... on conflict (order_id)` matches
-- it. NULL order_ids stay distinct (Postgres default), so period-based payouts
-- with no order link are still allowed.
create unique index if not exists payouts_order_id_key
	on public.payouts (order_id);


-- ----------------------------------------------------------------------------
-- 1.6 — Notification types for the money lifecycle
-- ----------------------------------------------------------------------------
-- Enum members are only ADDED here (never used as data in this migration), so
-- this is safe inside the migration transaction.

alter type public.notification_type add value if not exists 'payment_received';
alter type public.notification_type add value if not exists 'order_delivered';
alter type public.notification_type add value if not exists 'escrow_released';
alter type public.notification_type add value if not exists 'payout_paid';


-- ----------------------------------------------------------------------------
-- 1.4 — create_payout_for_order(): the single payout-creation path
-- ----------------------------------------------------------------------------
-- Amount = the escrow row's seller_payout (falls back to subtotal + shipping).
-- Idempotent via payouts_order_id_key. SECURITY DEFINER so server (service_role)
-- and the cron owner can both call it; execute is locked to service_role.

create or replace function public.create_payout_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_seller uuid;
	v_payout numeric;
	v_method text;
begin
	select
		o.seller_id,
		coalesce(e.seller_payout, o.subtotal + o.shipping_fee),
		o.payment_method
	into v_seller, v_payout, v_method
	from public.orders o
	left join public.escrow_transactions e on e.order_id = o.id
	where o.id = p_order_id;

	if v_seller is null then
		return;
	end if;

	insert into public.payouts (seller_id, amount, period_start, period_end, status, method, order_id)
	values (v_seller, v_payout, current_date, current_date, 'pending', v_method, p_order_id)
	on conflict (order_id) do nothing;
end;
$$;

revoke all on function public.create_payout_for_order(uuid) from public;
grant execute on function public.create_payout_for_order(uuid) to service_role;


-- ----------------------------------------------------------------------------
-- 1.5 — auto_release_escrow(): 7-day escrow auto-release (canonical, in-DB)
-- ----------------------------------------------------------------------------
-- Completes delivered orders older than 7 days with no open dispute: releases
-- escrow, generates the payout, logs a status event, notifies the seller.
-- Returns the number of orders released. Runs daily via pg_cron (below).

create or replace function public.auto_release_escrow()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	v_order record;
	v_released int := 0;
begin
	for v_order in
		select o.id, o.buyer_id, o.seller_id, o.order_number
		from public.orders o
		where o.ss_status = 'delivered'
			and o.delivered_at is not null
			and o.delivered_at < now() - interval '7 days'
			and not exists (
				select 1 from public.disputes d
				where d.order_id = o.id and d.status in ('open', 'reviewing')
			)
	loop
		update public.orders
		set ss_status = 'completed', completed_at = now()
		where id = v_order.id;

		update public.escrow_transactions
		set ss_status = 'released', released_at = now()
		where order_id = v_order.id and ss_status = 'held';

		perform public.create_payout_for_order(v_order.id);

		insert into public.order_status_events (order_id, from_status, to_status, actor_id, note)
		values (v_order.id, 'delivered', 'completed', v_order.buyer_id,
			'Auto-released after 7 days (no confirmation, no open dispute)');

		insert into public.notifications (user_id, type, title, body, entity_type, entity_id)
		values (v_order.seller_id, 'escrow_released', 'Escrow released',
			'Payment for order ' || v_order.order_number || ' was auto-released after 7 days.',
			'order', v_order.id);

		v_released := v_released + 1;
	end loop;

	return v_released;
end;
$$;

revoke all on function public.auto_release_escrow() from public;
grant execute on function public.auto_release_escrow() to service_role;


-- ----------------------------------------------------------------------------
-- 1.5 — Schedule auto-release daily at 03:00 (pg_cron), idempotently
-- ----------------------------------------------------------------------------

do $$
begin
	-- Drop any prior schedule of the same name so re-running is a no-op.
	perform cron.unschedule('auto-release-escrow');
exception
	when others then null;
end $$;

select cron.schedule('auto-release-escrow', '0 3 * * *', $cron$select public.auto_release_escrow();$cron$);
