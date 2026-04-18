"use client";

import type { KeyboardEvent } from "react";

import { Star } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type ReviewStarsProps = {
	value: number;
	onChange?: (rating: number) => void;
	readOnly?: boolean;
	className?: string;
};

export function ReviewStars({ value, onChange, readOnly = false, className }: ReviewStarsProps) {
	const interactive = Boolean(onChange) && !readOnly;

	function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
		if (!interactive || !onChange) return;
		if (e.key === "ArrowRight" || e.key === "ArrowUp") {
			e.preventDefault();
			onChange(value === 0 ? 1 : Math.min(5, value + 1));
			return;
		}
		if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
			e.preventDefault();
			onChange(Math.max(0, value - 1));
			return;
		}
		if (e.key === "Home") {
			e.preventDefault();
			onChange(1);
			return;
		}
		if (e.key === "End") {
			e.preventDefault();
			onChange(5);
		}
	}

	return (
		<div
			className={cn("flex items-center gap-0.5", interactive && "outline-none", className)}
			role={interactive ? "radiogroup" : undefined}
			aria-label={interactive ? "Rating" : `Rating: ${value} out of 5`}
			tabIndex={interactive ? 0 : undefined}
			onKeyDown={onKeyDown}
		>
			{[1, 2, 3, 4, 5].map((n) => {
				const filled = n <= value;
				if (interactive && onChange) {
					return (
						<Button
							key={n}
							type="button"
							variant="ghost"
							size="icon-sm"
							className="text-amber-500 hover:text-amber-600"
							aria-label={`${n} star${n > 1 ? "s" : ""}`}
							aria-checked={value === n}
							role="radio"
							tabIndex={-1}
							onClick={() => onChange(n)}
						>
							<Star className={cn("size-5", filled && "fill-current")} aria-hidden />
						</Button>
					);
				}
				return (
					<Star
						key={n}
						className={cn("size-4", filled ? "fill-amber-500 text-amber-500" : "text-muted-foreground")}
						aria-hidden
					/>
				);
			})}
		</div>
	);
}
