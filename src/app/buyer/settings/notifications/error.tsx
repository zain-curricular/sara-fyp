"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function NotificationsSettingsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load notification settings"
			error={error}
			reset={reset}
		/>
	);
}
