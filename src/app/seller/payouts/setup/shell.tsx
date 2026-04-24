// ============================================================================
// Payout Setup Shell
// ============================================================================
//
// Form for configuring payout method (bank transfer / JazzCash / EasyPaisa).
// Saves account details to profile metadata via PATCH /api/auth/me (or a
// dedicated profile update endpoint).

"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import type { PayoutSettings } from "./page";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Method options
// ----------------------------------------------------------------------------

type Method = NonNullable<PayoutSettings["method"]>;

const METHODS: { value: Method; label: string; sub: string }[] = [
	{ value: "bank_transfer", label: "Bank Transfer", sub: "Standard bank account" },
	{ value: "jazzcash", label: "JazzCash", sub: "Mobile wallet" },
	{ value: "easypaisa", label: "EasyPaisa", sub: "Mobile wallet" },
];

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function PayoutSetupShell({ settings }: { settings: PayoutSettings }) {
	const [method, setMethod] = useState<Method | "">(settings.method ?? "");
	const [accountTitle, setAccountTitle] = useState(settings.accountTitle);
	const [accountNumber, setAccountNumber] = useState(settings.accountNumber);
	const [bankName, setBankName] = useState(settings.bankName);
	const [busy, setBusy] = useState(false);
	const [saved, setSaved] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function handleSave() {
		if (!method) {
			setErrorMsg("Select a payout method");
			return;
		}

		setErrorMsg(null);
		setSaved(false);
		setBusy(true);

		try {
			const res = await fetch("/api/auth/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					metadata: {
						payout_method: method,
						payout_account_title: accountTitle,
						payout_account_number: accountNumber,
						payout_bank_name: bankName,
					},
				}),
			});

			const json = (await res.json()) as { ok: boolean; error?: string };

			if (!json.ok) {
				setErrorMsg(json.error ?? "Failed to save");
			} else {
				setSaved(true);
				setTimeout(() => setSaved(false), 3000);
			}
		} catch {
			setErrorMsg("Network error — please try again");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div container-id="payout-setup-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="payout-setup-header" className="flex flex-col gap-1">
				<Link
					href="/seller/payouts"
					className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5 pl-0")}
				>
					<ArrowLeft className="size-3.5" aria-hidden />
					Back to payouts
				</Link>
				<h1 className="text-3xl font-bold tracking-tight">Payout method</h1>
				<p className="text-sm text-muted-foreground">
					Set up how you receive your earnings
				</p>
			</header>

			{errorMsg && (
				<p
					role="alert"
					className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
				>
					{errorMsg}
				</p>
			)}

			{/* Method selection */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Select method</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						{METHODS.map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => setMethod(opt.value)}
								className={cn(
									"flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
									method === opt.value
										? "border-primary bg-primary/5"
										: "border-border bg-background hover:border-foreground/30",
								)}
							>
								<span
									className={cn(
										"text-sm font-semibold",
										method === opt.value ? "text-primary" : "text-foreground",
									)}
								>
									{opt.label}
								</span>
								<span className="text-[10px] text-muted-foreground">{opt.sub}</span>
							</button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Account details */}
			{method && (
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							Account details
							<Badge variant="secondary" className="rounded-sm text-[10px]">
								{METHODS.find((m) => m.value === method)?.label}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<Field>
							<FieldLabel htmlFor="account-title">Account title</FieldLabel>
							<Input
								id="account-title"
								value={accountTitle}
								onChange={(e) => setAccountTitle(e.target.value)}
								placeholder="e.g. Muhammad Ali"
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="account-number">
								{method === "bank_transfer" ? "Account / IBAN number" : "Mobile number"}
							</FieldLabel>
							<Input
								id="account-number"
								value={accountNumber}
								onChange={(e) => setAccountNumber(e.target.value)}
								placeholder={method === "bank_transfer" ? "PK36SCBL0000001123456702" : "03xx-xxxxxxx"}
							/>
						</Field>

						{method === "bank_transfer" && (
							<Field>
								<FieldLabel htmlFor="bank-name">Bank name</FieldLabel>
								<Select value={bankName} onValueChange={(v) => setBankName(v as string)}>
									<SelectTrigger id="bank-name" className="w-full">
										<SelectValue placeholder="Select bank" />
									</SelectTrigger>
									<SelectContent>
										{[
											"HBL",
											"MCB",
											"Allied Bank",
											"UBL",
											"Meezan Bank",
											"Standard Chartered",
											"Bank Alfalah",
											"Habib Metro",
											"Silk Bank",
											"Other",
										].map((bank) => (
											<SelectItem key={bank} value={bank}>
												{bank}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					</CardContent>
				</Card>
			)}

			{/* Save */}
			<div className="flex items-center justify-end gap-3">
				{saved && <span className="text-sm text-green-600">Saved successfully</span>}
				<Button
					type="button"
					disabled={busy || !method}
					onClick={() => void handleSave()}
				>
					{busy ? (
						<>
							<Loader2 className="size-4 animate-spin" aria-hidden />
							Saving…
						</>
					) : (
						"Save payout method"
					)}
				</Button>
			</div>
		</div>
	);
}
