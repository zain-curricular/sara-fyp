"use client";

export default function MechanicOnboardingError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4 py-12 text-center">
			<p className="text-sm font-medium text-destructive">{error.message}</p>
			<button onClick={reset} className="text-sm underline hover:no-underline">
				Try again
			</button>
		</div>
	);
}
