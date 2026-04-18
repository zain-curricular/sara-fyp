// ============================================================================
// ReviewStars
// ============================================================================
//
// Star rating control for reviews: interactive slider (keyboard + pointer) or
// read-only display. Used on the buyer review form and on read-only seller
// profile cards.
//
// Accessibility
// ---------------
// Interactive mode uses role="slider" with optional aria-labelledby pointing at
// a visible label id. If that id is missing in the DOM, we fall back to
// aria-label so the control always has a name. The parent should focus this
// control when the label is clicked (native <label htmlFor> does not reliably
// target a div role="slider").
//
import {
	forwardRef,
	useLayoutEffect,
	useState,
	type KeyboardEvent,
} from "react";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export type ReviewStarsProps = {
	value: number;
	onChange?: (rating: number) => void;
	readOnly?: boolean;
	className?: string;
	/** Sets `id` on the interactive slider (pair with a visible label + focus ref). */
	id?: string;
	/**
	 * Element `id` of the visible label (`aria-labelledby`). If the node is absent,
	 * the component falls back to `aria-label="Rating"` (and warns in development).
	 */
	labelId?: string;
	/** Optional id of a visible hint element (e.g. form help text) for keyboard/pointer instructions. */
	ariaDescribedBy?: string;
};

/**
 * Star rating: interactive slider with arrow keys and star clicks, or read-only stars.
 *
 * @param props - Rating value, optional change handler, and a11y ids for label/description.
 */
export const ReviewStars = forwardRef<HTMLDivElement, ReviewStarsProps>(
	function ReviewStars(
		{
			value,
			onChange,
			readOnly = false,
			className,
			id,
			labelId,
			ariaDescribedBy,
		},
		ref,
	) {
		const interactive = Boolean(onChange) && !readOnly;
		const [labelMissing, setLabelMissing] = useState(false);

		useLayoutEffect(() => {
			if (!labelId) {
				setLabelMissing(false);
				return;
			}
			const el = document.getElementById(labelId);
			const missing = !el;
			setLabelMissing(missing);
			if (missing && process.env.NODE_ENV === "development") {
				console.warn(
					`[ReviewStars] labelId="${labelId}" has no matching element; using aria-label fallback.`,
				);
			}
		}, [labelId]);

		const useLabelledBy = Boolean(labelId) && !labelMissing;

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

		const showTestSegments = process.env.NODE_ENV === "test";

		if (interactive && onChange) {
			return (
				<div
					ref={ref}
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
					aria-labelledby={useLabelledBy ? labelId : undefined}
					aria-label={useLabelledBy ? undefined : "Rating"}
					aria-describedby={ariaDescribedBy}
					onKeyDown={onKeyDown}
				>
					<div
						className="flex items-center gap-0.5"
						data-testid={showTestSegments ? "review-stars-segments" : undefined}
					>
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
				ref={ref}
				className={cn("flex items-center gap-0.5", className)}
				aria-label={`Rating: ${value} out of 5`}
			>
				{[1, 2, 3, 4, 5].map((n) => {
					const filled = n <= value;
					return (
						<Star
							key={n}
							className={cn(
								"size-4",
								filled ? "fill-amber-500 text-amber-500" : "text-muted-foreground",
							)}
							aria-hidden
						/>
					);
				})}
			</div>
		);
	},
);

ReviewStars.displayName = "ReviewStars";
