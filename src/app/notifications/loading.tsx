// ============================================================================
// /notifications — Loading Skeleton
// ============================================================================
//
// Renders immediately while the RSC fetches notifications.
// Mirrors NotificationsShell layout for zero layout shift.

import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function NotificationCardSkeleton() {
	return (
		<Card size="sm">
			<CardContent className="flex items-start gap-3 py-3">
				<Skeleton className="mt-0.5 size-8 shrink-0 rounded-full" />
				<div className="flex flex-1 flex-col gap-1.5">
					<div className="flex items-start justify-between gap-2">
						<Skeleton className="h-3.5 w-48" />
						<Skeleton className="h-3 w-12 shrink-0" />
					</div>
					<Skeleton className="h-3 w-64" />
				</div>
			</CardContent>
		</Card>
	);
}

function FilterSidebarSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-3.5 w-16" />
			</CardHeader>
			<CardContent className="flex flex-col gap-1.5">
				<Skeleton className="h-8 w-full rounded-md" />
				<Skeleton className="h-8 w-full rounded-md" />
			</CardContent>
		</Card>
	);
}

export default function NotificationsLoading() {
	return (
		<div container-id="notifications-shell" className="flex flex-col gap-5">

			{/* Header skeleton */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-6 w-20 rounded-sm" />
			</div>

			{/* Two-column layout */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">

				{/* Sidebar */}
				<FilterSidebarSkeleton />

				{/* Feed */}
				<div container-id="notifications-feed-skeleton" className="flex flex-col gap-5">
					{/* Today group */}
					<div className="flex flex-col gap-2">
						<Skeleton className="h-3 w-10" />
						<NotificationCardSkeleton />
						<NotificationCardSkeleton />
						<NotificationCardSkeleton />
					</div>

					{/* Yesterday group */}
					<div className="flex flex-col gap-2">
						<Skeleton className="h-3 w-16" />
						<NotificationCardSkeleton />
						<NotificationCardSkeleton />
					</div>
				</div>
			</div>
		</div>
	);
}
