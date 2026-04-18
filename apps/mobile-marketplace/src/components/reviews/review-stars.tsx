"use client";

import type { KeyboardEvent } from "react";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type ReviewStarsProps = {
	value: number;
	onChange?: (rating: number) => void;
	readOnly?: boolean;
	className?: string;
	/** Sets `id` on the interactive slider (pair with `<Label htmlFor={id}>`). */
	id?: string;
	/** Visible label element `id` for `aria-labelledby` (omit in tests / standalone). */
	labelId?: string;
	/** Optional id of a visible hint element (e.g. form help text) for keyboard/pointer instructions. */
	ariaDescribedBy?: string;
};

export function ReviewStars({
	value,
	onChange,
	readOnly = false,
	className,
	id,
	labelId,
	ariaDescribedBy,
}: ReviewStarsProps) {
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

	if (interactive && onChange) {
		return (
			<div
				id={id}
				className={cn(
					"flex flex-col gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					className,
				)}
				role="slider"
				tabIndex={0}
				aria-valuemin={0}
				aria-valuemax={5}
				aria-valuenow={value}
				aria-valuetext={value === 0 ? "No rating selected" : `${value} out of 5 stars`}
				aria-labelledby={labelId}
				aria-label={labelId ? undefined : "Rating"}
				aria-describedby={ariaDescribedBy}
				onKeyDown={onKeyDown}
			>
				<div className="flex items-center gap-0.5" data-testid="review-stars-segments">
					{[1, 2, 3, 4, 5].map((n) => {
						const filled = n <= value;
						return (
							<span
								key={n}
								role="presentation"
								className="inline-flex cursor-pointer rounded-md p-0.5 text-amber-500 hover:text-amber-600"
								onClick={() => onChange(n)}
							>
								<Star className={cn("size-5", filled && "fill-current")} aria-hidden />
							</span>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn("flex items-center gap-0.5", className)}
			aria-label={`Rating: ${value} out of 5`}
		>
			{[1, 2, 3, 4, 5].map((n) => {
				const filled = n <= value;
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
