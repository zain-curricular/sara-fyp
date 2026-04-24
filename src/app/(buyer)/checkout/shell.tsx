// ============================================================================
// Checkout Shell — Client
// ============================================================================
//
// Multi-step checkout flow for one or more seller groups.
// Step 1: Shipping address (react-hook-form)
// Step 2: Payment method (COD / JazzCash / EasyPaisa / Card — stubs)
// Step 3: Review + place order
//
// One order is created per seller group. After all orders placed,
// redirects to success page for the first order.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CreditCard, MapPin, Package } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/utils/currency";

import type { SellerGroup } from "@/lib/features/cart/types";
import { usePlaceOrder } from "@/lib/features/orders/hooks";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type CheckoutShellProps = {
	groups: SellerGroup[];
};

// ----------------------------------------------------------------------------
// Step types
// ----------------------------------------------------------------------------

type Step = "shipping" | "payment" | "review";

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
	{ key: "shipping", label: "Shipping", icon: MapPin },
	{ key: "payment", label: "Payment", icon: CreditCard },
	{ key: "review", label: "Review", icon: Package },
];

// ----------------------------------------------------------------------------
// Address form schema
// ----------------------------------------------------------------------------

const addressSchema = z.object({
	fullName: z.string().min(2, "Full name required"),
	phone: z.string().min(10, "Valid phone number required"),
	addressLine: z.string().min(5, "Address required"),
	city: z.string().min(2, "City required"),
	province: z.string().min(2, "Province required"),
});

type AddressFormData = z.infer<typeof addressSchema>;

type PaymentMethod = "cod" | "jazzcash" | "easypaisa" | "card";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; desc: string }[] = [
	{ value: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives" },
	{ value: "jazzcash", label: "JazzCash", desc: "Redirect to JazzCash payment gateway" },
	{ value: "easypaisa", label: "EasyPaisa", desc: "Redirect to EasyPaisa payment gateway" },
	{ value: "card", label: "Card", desc: "Debit / credit card via secure gateway" },
];

// ----------------------------------------------------------------------------
// Step indicator
// ----------------------------------------------------------------------------

function StepIndicator({ current, steps }: { current: Step; steps: typeof STEPS }) {
	const currentIdx = steps.findIndex((s) => s.key === current);

	return (
		<div container-id="step-indicator" className="flex items-center gap-0">
			{steps.map((step, i) => {
				const Icon = step.icon;
				const isDone = i < currentIdx;
				const isActive = i === currentIdx;

				return (
					<div key={step.key} className="flex items-center">
						<div className="flex flex-col items-center gap-1">
							<div
								className={cn(
									"flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
									isDone && "border-foreground bg-foreground text-background",
									isActive && "border-primary bg-primary text-primary-foreground",
									!isDone && !isActive && "border-border bg-background text-muted-foreground",
								)}
							>
								{isDone ? <CheckCircle2 className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
							</div>
							<span className={cn("text-[10px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
								{step.label}
							</span>
						</div>

						{i < steps.length - 1 && (
							<div
								className={cn(
									"mx-2 mb-4 h-0.5 w-12",
									i < currentIdx ? "bg-foreground/30" : "bg-border",
								)}
								aria-hidden
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function CheckoutShell({ groups }: CheckoutShellProps) {
	const [step, setStep] = useState<Step>("shipping");
	const [address, setAddress] = useState<AddressFormData | null>(null);
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
	const [placingError, setPlacingError] = useState<string | null>(null);

	const placeOrder = usePlaceOrder();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<AddressFormData>({
		resolver: zodResolver(addressSchema),
	});

	const shippingFee = 250;
	const totalSubtotal = groups.reduce((s, g) => s + g.subtotal, 0);
	const platformFee = Math.round(totalSubtotal * 0.03);
	const grandTotal = totalSubtotal + shippingFee * groups.length + platformFee;

	function onAddressSubmit(data: AddressFormData) {
		setAddress(data);
		setStep("payment");
	}

	async function handlePlaceOrders() {
		if (!address) return;

		setPlacingError(null);

		// Place one order per seller group sequentially
		for (const group of groups) {
			await placeOrder.mutateAsync({
				cartGroupSellerId: group.sellerId,
				shippingAddressId: null,
				shippingAddress: address,
				paymentMethod,
			});
		}
		// usePlaceOrder redirects to success page on the last order
	}

	return (
		<div container-id="checkout-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="checkout-header" className="flex flex-col gap-4">
				<h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
				<StepIndicator current={step} steps={STEPS} />
			</header>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">

				{/* Main content */}
				<div container-id="checkout-main" className="flex flex-col gap-4">

					{/* Step 1: Shipping */}
					{step === "shipping" && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<MapPin className="size-4" aria-hidden />
									Shipping address
								</CardTitle>
							</CardHeader>

							<CardContent>
								<form onSubmit={handleSubmit(onAddressSubmit)} className="flex flex-col gap-4" noValidate>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="flex flex-col gap-1.5">
											<Label htmlFor="fullName">Full name</Label>
											<Input id="fullName" {...register("fullName")} placeholder="Ahmed Khan" />
											{errors.fullName && (
												<p className="text-xs text-destructive">{errors.fullName.message}</p>
											)}
										</div>

										<div className="flex flex-col gap-1.5">
											<Label htmlFor="phone">Phone number</Label>
											<Input id="phone" {...register("phone")} placeholder="03001234567" />
											{errors.phone && (
												<p className="text-xs text-destructive">{errors.phone.message}</p>
											)}
										</div>
									</div>

									<div className="flex flex-col gap-1.5">
										<Label htmlFor="addressLine">Address</Label>
										<Input
											id="addressLine"
											{...register("addressLine")}
											placeholder="House 5, Street 10, DHA Phase 6"
										/>
										{errors.addressLine && (
											<p className="text-xs text-destructive">{errors.addressLine.message}</p>
										)}
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="flex flex-col gap-1.5">
											<Label htmlFor="city">City</Label>
											<Input id="city" {...register("city")} placeholder="Lahore" />
											{errors.city && (
												<p className="text-xs text-destructive">{errors.city.message}</p>
											)}
										</div>

										<div className="flex flex-col gap-1.5">
											<Label htmlFor="province">Province</Label>
											<Input id="province" {...register("province")} placeholder="Punjab" />
											{errors.province && (
												<p className="text-xs text-destructive">{errors.province.message}</p>
											)}
										</div>
									</div>

									<Button type="submit" className="mt-2 w-full sm:w-auto sm:self-end">
										Continue to payment →
									</Button>
								</form>
							</CardContent>
						</Card>
					)}

					{/* Step 2: Payment */}
					{step === "payment" && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<CreditCard className="size-4" aria-hidden />
									Payment method
								</CardTitle>
							</CardHeader>

							<CardContent className="flex flex-col gap-3">
								{PAYMENT_METHODS.map((method) => (
									<label
										key={method.value}
										className={cn(
											"flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
											paymentMethod === method.value
												? "border-primary bg-primary/5"
												: "border-border hover:border-foreground/30",
										)}
									>
										<input
											type="radio"
											name="paymentMethod"
											value={method.value}
											checked={paymentMethod === method.value}
											onChange={() => setPaymentMethod(method.value)}
											className="mt-0.5 shrink-0"
										/>
										<div className="flex flex-col gap-0.5">
											<span className="text-sm font-semibold">{method.label}</span>
											<span className="text-xs text-muted-foreground">{method.desc}</span>
											{method.value !== "cod" && (
												<Badge variant="secondary" className="mt-1 w-fit rounded-sm text-[9px]">
													Coming soon
												</Badge>
											)}
										</div>
									</label>
								))}

								<div className="flex gap-3 pt-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => setStep("shipping")}
									>
										← Back
									</Button>
									<Button
										type="button"
										onClick={() => setStep("review")}
										disabled={paymentMethod !== "cod"}
									>
										Review order →
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Step 3: Review */}
					{step === "review" && (
						<div className="flex flex-col gap-4">
							{/* Shipping summary */}
							<Card>
								<CardHeader>
									<CardTitle className="text-sm font-semibold text-muted-foreground">
										Shipping to
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-0">
									{address && (
										<div className="text-sm">
											<p className="font-semibold">{address.fullName}</p>
											<p className="text-muted-foreground">{address.phone}</p>
											<p className="text-muted-foreground">{address.addressLine}</p>
											<p className="text-muted-foreground">
												{address.city}, {address.province}
											</p>
										</div>
									)}
									<button
										type="button"
										onClick={() => setStep("shipping")}
										className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
									>
										Edit
									</button>
								</CardContent>
							</Card>

							{/* Per-seller order preview */}
							{groups.map((group) => (
								<Card key={group.sellerId}>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-semibold">
											Order from {group.storeName}
										</CardTitle>
									</CardHeader>

									<CardContent className="flex flex-col gap-3">
										{group.items.map((item) => (
											<div key={item.id} className="flex gap-3">
												<div className="aspect-square w-12 shrink-0 overflow-hidden rounded bg-muted/40">
													{item.listing?.imageUrl && (
														<img
															src={item.listing.imageUrl}
															alt={item.listing.title}
															className="h-full w-full object-cover"
														/>
													)}
												</div>
												<div className="flex min-w-0 flex-1 flex-col gap-0.5">
													<p className="truncate text-sm font-medium">
														{item.listing?.title ?? "Unknown"}
													</p>
													<p className="text-xs text-muted-foreground">
														Qty: {item.qty} × {formatPKR(item.snapshotPrice)}
													</p>
												</div>
												<span className="shrink-0 text-sm font-bold tabular-nums">
													{formatPKR(item.snapshotPrice * item.qty)}
												</span>
											</div>
										))}

										<Separator />

										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Subtotal</span>
											<span className="tabular-nums">{formatPKR(group.subtotal)}</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Shipping</span>
											<span className="tabular-nums">{formatPKR(shippingFee)}</span>
										</div>
									</CardContent>
								</Card>
							))}

							{/* Error */}
							{(placingError ?? placeOrder.error) && (
								<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{placingError ?? placeOrder.error?.message}
								</p>
							)}

							<div className="flex gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={() => setStep("payment")}
									disabled={placeOrder.isPending}
								>
									← Back
								</Button>
								<Button
									type="button"
									onClick={handlePlaceOrders}
									disabled={placeOrder.isPending}
									className="flex-1"
								>
									{placeOrder.isPending
										? "Placing order…"
										: `Place order${groups.length > 1 ? "s" : ""} — ${formatPKR(grandTotal)}`}
								</Button>
							</div>
						</div>
					)}
				</div>

				{/* Sidebar summary */}
				<div container-id="checkout-summary" className="lg:sticky lg:top-20">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">Order summary</CardTitle>
						</CardHeader>

						<CardContent className="flex flex-col gap-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Items ({groups.reduce((s, g) => s + g.items.length, 0)})
								</span>
								<span className="tabular-nums">{formatPKR(totalSubtotal)}</span>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Shipping × {groups.length}
								</span>
								<span className="tabular-nums">{formatPKR(shippingFee * groups.length)}</span>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Platform fee (3%)</span>
								<span className="tabular-nums">{formatPKR(platformFee)}</span>
							</div>

							<Separator />

							<div className="flex items-center justify-between">
								<span className="font-semibold">Total</span>
								<span className="text-lg font-bold tabular-nums text-primary">
									{formatPKR(grandTotal)}
								</span>
							</div>

							<p className="text-[10px] leading-relaxed text-muted-foreground">
								Payment is held in escrow until you confirm receipt.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
