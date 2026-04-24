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
		<nav aria-label="Onboarding progress" container-id="step-progress">
			<ol className="relative flex items-start justify-between gap-2">
				{labels.map((label, i) => {
					const done = i < currentStep;
					const active = i === currentStep;
					const last = i === labels.length - 1;
					return (
						<li
							key={label}
							className="relative flex min-w-0 flex-1 flex-col items-center gap-2"
						>
							{!last ? (
								<span
									aria-hidden
									className={cn(
										"absolute left-1/2 top-[18px] h-px w-full -translate-y-1/2",
										done ? "bg-primary" : "bg-border",
									)}
								/>
							) : null}
							<span
								className={cn(
									"relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-semibold transition-colors",
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
