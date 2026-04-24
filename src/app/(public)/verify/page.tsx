// ============================================================================
// Part Verification Landing Page
// ============================================================================
//
// Client component — buyers enter a part ID (or scan a QR code elsewhere and
// land here with a pre-filled ID) and are routed to /verify/{id} for the
// authenticity result. No auth required.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

export default function VerifyPage() {
	const router = useRouter();
	const [partId, setPartId] = useState("");

	function handleVerify() {
		const trimmed = partId.trim();
		if (!trimmed) return;
		router.push(`/verify/${trimmed}`);
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") handleVerify();
	}

	return (
		<div container-id="verify-page" className="flex flex-col flex-1 min-h-0 items-center justify-center p-4">
			<Card container-id="verify-card" className="w-full max-w-md">
				<CardHeader container-id="verify-header">
					<CardTitle className="text-2xl">Verify Part Authenticity</CardTitle>
					<p className="text-sm text-muted-foreground">
						Scan the QR code on your part or enter the part ID below.
					</p>
				</CardHeader>
				<CardContent container-id="verify-form" className="flex flex-col gap-4">
					<Input
						id="part-id"
						placeholder="Enter part ID…"
						value={partId}
						onChange={(e) => setPartId(e.target.value)}
						onKeyDown={handleKeyDown}
						aria-label="Part ID"
					/>
					<Button onClick={handleVerify} disabled={!partId.trim()} className="w-full">
						Verify
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
