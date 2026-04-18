"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function BuyerShell() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Buyer</h1>
				<p className="text-muted-foreground">Purchases and saved searches will live here.</p>
			</div>
			<Link
				className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
				href="/buyer/settings/profile"
			>
				Settings
			</Link>
		</div>
	);
}
