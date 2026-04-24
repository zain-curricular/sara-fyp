"use client";

export default function MechanicRequestDetailError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4 py-12 text-center">
			<p className="text-sm text-destructive">{error.message}</p>
			<button onClick={reset} className="text-sm underline">Try again</button>
		</div>
	);
}
