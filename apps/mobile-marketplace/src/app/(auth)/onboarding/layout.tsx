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
			className="mx-auto flex w-full max-w-md flex-col items-center space-y-8 sm:max-w-lg"
		>
			<div className="w-full">
				<StepProgress currentStep={currentStep} labels={LABELS} />
			</div>
			<div className="flex w-full flex-col items-center">{children}</div>
		</div>
	);
}
