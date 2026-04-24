// ============================================================================
// Cart Shell — Client
// ============================================================================
//
// Interactive cart page. Items are grouped by seller. Each group shows items
// with qty stepper, unit price, line total, and a remove button. Per-group
// subtotal and a checkout CTA. Uses React Query for mutations; initial data
// hydrated from SSR.

"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/utils/currency";

import type { Cart, CartItem, SellerGroup } from "@/lib/features/cart/types";
import {
	useCart,
	useUpdateCartItem,
	useRemoveCartItem,
} from "@/lib/features/cart/hooks";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type CartShellProps = {
	initialCart: Cart | null;
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function groupBySeller(items: CartItem[]): SellerGroup[] {
	const map = new Map<string, SellerGroup>();

	for (const item of items) {
		if (!item.listing) continue;

		const { sellerId, storeName, storeSlug } = item.listing;
		const existing = map.get(sellerId);

		if (existing) {
			existing.items.push(item);
			existing.subtotal += item.snapshotPrice * item.qty;
		} else {
			map.set(sellerId, {
				sellerId,
				storeName,
				storeSlug,
				items: [item],
				subtotal: item.snapshotPrice * item.qty,
			});
		}
	}

	return Array.from(map.values());
}

// ----------------------------------------------------------------------------
// Item row
// ----------------------------------------------------------------------------

function CartItemRow({ item }: { item: CartItem }) {
	const update = useUpdateCartItem();
	const remove = useRemoveCartItem();

	const isPending = update.isPending || remove.isPending;
	const lineTotal = item.snapshotPrice * item.qty;

	function handleQtyChange(delta: number) {
		const next = item.qty + delta;
		if (next < 1) return;
		update.mutate({ cartItemId: item.id, qty: next });
	}

	function handleRemove() {
		remove.mutate({ cartItemId: item.id });
	}

	return (
		<div
			container-id="cart-item-row"
			className={cn(
				"flex gap-4 py-4 transition-opacity",
				isPending && "opacity-50 pointer-events-none",
			)}
		>
			{/* Thumbnail */}
			<div className="aspect-square w-16 shrink-0 overflow-hidden rounded-md bg-muted/40">
				{item.listing?.imageUrl ? (
					<img
						src={item.listing.imageUrl}
						alt={item.listing.title}
						className="h-full w-full object-cover"
					/>
				) : null}
			</div>

			{/* Info */}
			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				<p className="truncate text-sm font-semibold">
					{item.listing?.title ?? "Unknown listing"}
				</p>

				<p className="text-xs text-muted-foreground">
					Unit price: {formatPKR(item.snapshotPrice)}
				</p>

				{/* Qty stepper */}
				<div container-id="qty-stepper" className="flex items-center gap-2">
					<button
						type="button"
						aria-label="Decrease quantity"
						disabled={item.qty <= 1 || isPending}
						onClick={() => handleQtyChange(-1)}
						className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
					>
						<Minus className="size-3" aria-hidden />
					</button>

					<span className="w-6 text-center text-sm font-medium tabular-nums">
						{item.qty}
					</span>

					<button
						type="button"
						aria-label="Increase quantity"
						disabled={isPending}
						onClick={() => handleQtyChange(1)}
						className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
					>
						<Plus className="size-3" aria-hidden />
					</button>
				</div>
			</div>

			{/* Right side */}
			<div className="flex shrink-0 flex-col items-end justify-between">
				<span className="text-sm font-bold tabular-nums text-primary">
					{formatPKR(lineTotal)}
				</span>

				<button
					type="button"
					aria-label="Remove item"
					disabled={isPending}
					onClick={handleRemove}
					className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
				>
					<Trash2 className="size-4" aria-hidden />
				</button>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Seller group
// ----------------------------------------------------------------------------

function SellerGroupCard({ group }: { group: SellerGroup }) {
	return (
		<Card container-id="seller-group-card">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold">
					<span>{group.storeName}</span>
					<Badge variant="secondary" className="rounded-sm text-[10px]">
						{group.items.length} item{group.items.length !== 1 ? "s" : ""}
					</Badge>
				</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-col gap-0 px-4">
				{group.items.map((item, i) => (
					<div key={item.id}>
						<CartItemRow item={item} />
						{i < group.items.length - 1 && <Separator />}
					</div>
				))}

				<Separator className="mt-2" />

				<div className="flex items-center justify-between py-3">
					<span className="text-sm text-muted-foreground">Subtotal</span>
					<span className="text-base font-bold tabular-nums text-primary">
						{formatPKR(group.subtotal)}
					</span>
				</div>

				<Link
					href={`/checkout?seller=${encodeURIComponent(group.sellerId)}`}
					className={cn(buttonVariants({ size: "sm" }), "mb-1 w-full")}
				>
					Proceed to checkout →
				</Link>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function CartShell({ initialCart }: CartShellProps) {
	const qc = useQueryClient();

	// Hydrate React Query cache with SSR data
	if (initialCart && !qc.getQueryData(["cart"])) {
		qc.setQueryData(["cart"], initialCart);
	}

	const { data: cart, isLoading } = useCart();

	const items = cart?.items ?? [];
	const groups = groupBySeller(items);
	const totalItems = items.reduce((s, i) => s + i.qty, 0);
	const grandTotal = items.reduce((s, i) => s + i.snapshotPrice * i.qty, 0);

	// Loading state
	if (isLoading && !initialCart) {
		return (
			<div container-id="cart-shell-loading" className="flex flex-col gap-6">
				<div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
				<div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
			</div>
		);
	}

	// Empty state
	if (groups.length === 0) {
		return (
			<div container-id="cart-shell-empty" className="flex flex-col gap-6">
				<header className="flex items-center gap-3">
					<ShoppingCart className="size-6 text-muted-foreground" aria-hidden />
					<h1 className="text-2xl font-bold tracking-tight">My cart</h1>
				</header>

				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
					<ShoppingCart className="size-10 text-muted-foreground/40" aria-hidden />
					<div className="flex flex-col gap-1">
						<p className="text-base font-semibold">Your cart is empty</p>
						<p className="text-sm text-muted-foreground">
							Browse listings and add parts you need.
						</p>
					</div>
					<Link href="/browse" className={buttonVariants({ variant: "outline" })}>
						Browse parts
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div container-id="cart-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header
				container-id="cart-header"
				className="flex flex-wrap items-center justify-between gap-3"
			>
				<div className="flex items-center gap-3">
					<ShoppingCart className="size-5 text-muted-foreground" aria-hidden />
					<h1 className="text-2xl font-bold tracking-tight">My cart</h1>
				</div>
				<Badge variant="secondary" className="rounded-sm">
					{totalItems} item{totalItems !== 1 ? "s" : ""}
				</Badge>
			</header>

			{/* Multi-seller layout */}
			<div container-id="cart-groups" className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px] lg:items-start">

				{/* Groups */}
				<div className="flex flex-col gap-4">
					{groups.map((group) => (
						<SellerGroupCard key={group.sellerId} group={group} />
					))}
				</div>

				{/* Order summary sidebar */}
				<div container-id="cart-summary" className="lg:sticky lg:top-20">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">Order summary</CardTitle>
						</CardHeader>

						<CardContent className="flex flex-col gap-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									{totalItems} item{totalItems !== 1 ? "s" : ""}
								</span>
								<span className="tabular-nums">{formatPKR(grandTotal)}</span>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Shipping</span>
								<span className="text-muted-foreground">Calculated at checkout</span>
							</div>

							<Separator />

							<div className="flex items-center justify-between">
								<span className="font-semibold">Estimated total</span>
								<span className="text-lg font-bold tabular-nums text-primary">
									{formatPKR(grandTotal)}
								</span>
							</div>

							{groups.length === 1 ? (
								<Link
									href={`/checkout?seller=${encodeURIComponent(groups[0]!.sellerId)}`}
									className={cn(buttonVariants(), "w-full")}
								>
									Checkout →
								</Link>
							) : (
								<Link
									href="/checkout"
									className={cn(buttonVariants(), "w-full")}
								>
									Checkout all ({groups.length} orders) →
								</Link>
							)}

							<Link
								href="/browse"
								className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
							>
								Continue shopping
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
