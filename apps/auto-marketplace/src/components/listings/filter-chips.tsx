"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/primitives/button";

export type ActiveFilterChip = {
	key: string;
	label: string;
	removeHref: string;
};

type FilterChipsProps = {
	chips: ActiveFilterChip[];
	className?: string;
};

export function FilterChips({ chips, className }: FilterChipsProps) {
	if (!chips.length) return null;

	return (
		<div className={cn("flex flex-wrap items-center gap-2", className)}>
			{chips.map((c) => (
				<Badge key={c.key} variant="secondary" className="gap-1 pr-1">
					<span>{c.label}</span>
					<Link
						href={c.removeHref}
						aria-label={`Remove ${c.label}`}
						className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "size-5 shrink-0")}
					>
						<X className="size-3" />
					</Link>
				</Badge>
			))}
		</div>
	);
}
