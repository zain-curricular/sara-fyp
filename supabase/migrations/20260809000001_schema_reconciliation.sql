-- ============================================================================
-- Schema Reconciliation — ShopSmart ship-ready Phase 0
-- ============================================================================
--
-- Reconciles the code<->schema drift surfaced by the ship-readiness audit
-- (docs/ship-roadmap/phase-0-schema-reconciliation-and-security.md). The
-- service layer was written against columns/enums/constraints that were never
-- migrated; this file moves the SCHEMA toward the code where that is the
-- cheaper, lower-risk direction (add columns / relax NOT NULLs / add enum
-- members), while the accompanying service edits move CODE toward the schema
-- where a column was merely mis-named.
--
-- Purely additive & constraint-relaxing — nothing is dropped or renamed, so
-- the existing supabase/seed.sql continues to apply unchanged.
--
-- Decisions (see docs/ship-roadmap/INDEX.md §8):
--   §8.3  relax legacy orders.listing_id / orders.amount to NULL
--   §8.4  ss_status is canonical for ShopSmart; add released_at/refunded_at
--
-- Covers roadmap tasks 0.1 (messaging), 0.2 (orders/escrow), 0.4 (fraud key).


-- ----------------------------------------------------------------------------
-- 0.1 — Messaging
-- ----------------------------------------------------------------------------
-- A conversation may be order-scoped rather than listing-scoped, and may link
-- to the order it concerns. Messages carry optional attachment metadata that
-- the messaging service already reads/writes.

alter table public.conversations
	alter column listing_id drop not null;

alter table public.conversations
	add column if not exists order_id uuid references public.orders (id) on delete set null;

alter table public.messages
	add column if not exists attachments jsonb not null default '[]'::jsonb;


-- ----------------------------------------------------------------------------
-- 0.2 — Orders & escrow
-- ----------------------------------------------------------------------------
-- ShopSmart multi-item orders do not populate the legacy per-order listing_id
-- or amount (those belong to the device-testing flow). Relax both to NULL and
-- widen the amount CHECK so placeOrder can insert without a NOT NULL violation.

alter table public.orders
	alter column listing_id drop not null;

alter table public.orders
	alter column amount drop not null;

alter table public.orders
	drop constraint if exists orders_amount_check;

alter table public.orders
	add constraint orders_amount_check check (amount is null or amount > 0);

-- Escrow ledger timestamps for the ss_status lifecycle (held -> released/refunded).
alter table public.escrow_transactions
	add column if not exists released_at timestamptz;

alter table public.escrow_transactions
	add column if not exists refunded_at timestamptz;

-- The checkout offers Cash-on-Delivery and Card, which the payment_method enum
-- lacked. Adding them lets escrow_transactions.payment_method record the real
-- method (the P1 sandbox gateway builds on this). IF NOT EXISTS keeps it
-- idempotent; values are not consumed in this migration.
alter type public.payment_method add value if not exists 'cod';
alter type public.payment_method add value if not exists 'card';


-- ----------------------------------------------------------------------------
-- 0.4 — Fraud signal upsert key
-- ----------------------------------------------------------------------------
-- One signal per (signal_type, subject_id) so the fraud worker (P3.6) can
-- upsert instead of duplicating. Guarded so re-application is a no-op.

do $$
begin
	if not exists (
		select 1 from pg_constraint where conname = 'fraud_signals_signal_subject_key'
	) then
		alter table public.fraud_signals
			add constraint fraud_signals_signal_subject_key unique (signal_type, subject_id);
	end if;
end $$;
