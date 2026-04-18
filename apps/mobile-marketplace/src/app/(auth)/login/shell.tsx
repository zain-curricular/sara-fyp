"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function LoginShell() {
	return (
		<div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
			<div className="space-y-1 text-center">
				<h1 className="text-xl font-semibold">Sign in</h1>
				<p className="text-sm text-muted-foreground">
					Authentication will use Supabase — wire OAuth or email in a follow-up ticket.
				</p>
			</div>
			<Link className={cn(buttonVariants(), "flex w-full justify-center")} href="/">
				Back to home
			</Link>
		</div>
	);
}
