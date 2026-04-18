"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
	labels: string[];
	currentStep: number;
};

/** Linear step indicator for the onboarding wizard (0-based `currentStep`). */
export function StepProgress({ labels, currentStep }: Props) {
	return (
		<nav aria-label="Onboarding progress">
			<ol className="flex items-start justify-between gap-1 sm:gap-2">
				{labels.map((label, i) => {
					const done = i < currentStep;
					const active = i === currentStep;
					return (
						<li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
									done && "border-primary bg-primary text-primary-foreground",
									active && !done && "border-primary text-primary",
									!active && !done && "border-border text-muted-foreground",
								)}
							>
								{done ? <Check aria-hidden className="size-4" /> : i + 1}
							</span>
							<span
								className={cn(
									"hidden text-center text-xs font-medium sm:block",
									active ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{label}
							</span>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
