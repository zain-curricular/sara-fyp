"use client";

import { usePathname } from "next/navigation";

import { StepProgress } from "./_components/step-progress";

const LABELS = ["Phone", "Verify", "Profile"];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const currentStep = pathname.includes("/onboarding/profile")
		? 2
		: pathname.includes("/onboarding/verify")
			? 1
			: 0;

	return (
		<div
			container-id="onboarding-layout"
			className="w-full max-w-md space-y-8 sm:max-w-lg"
		>
			<StepProgress currentStep={currentStep} labels={LABELS} />
			{children}
		</div>
	);
}
