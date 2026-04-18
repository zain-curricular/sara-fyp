"use client";

import { usePathname } from "next/navigation";

import { StepProgress } from "@/components/onboarding/step-progress";

const LABELS = ["Phone", "Verify", "Profile"];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const currentStep = pathname.includes("/onboarding/profile")
		? 2
		: pathname.includes("/onboarding/verify")
			? 1
			: 0;

	return (
		<div className="w-full max-w-md space-y-8">
			<StepProgress currentStep={currentStep} labels={LABELS} />
			{children}
		</div>
	);
}
