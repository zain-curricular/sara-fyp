// ============================================================================
// Admin Loading — Default Skeleton
// ============================================================================
//
// Default streaming skeleton for all admin pages while RSCs fetch data.

import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function KpiCardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-3 w-28" />
				<Skeleton className="size-4 rounded" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-8 w-20" />
				<Skeleton className="mt-1 h-3 w-16" />
			</CardContent>
		</Card>
	);
}

function TableRowSkeleton() {
	return (
		<div className="flex items-center gap-4 border-b border-border py-3 last:border-0">
			<Skeleton className="size-8 rounded-full" />
			<Skeleton className="h-4 w-40" />
			<Skeleton className="ml-auto h-4 w-24" />
		</div>
	);
}

export default function AdminLoading() {
	return (
		<div
			container-id="admin-loading"
			className="flex flex-col gap-6"
		>
			{/* Header */}
			<div className="flex flex-col gap-1">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-8 w-48" />
			</div>

			{/* KPI grid */}
			<div
				container-id="admin-loading-kpis"
				className="grid grid-cols-2 gap-4 sm:grid-cols-4"
			>
				{Array.from({ length: 8 }).map((_, i) => (
					<KpiCardSkeleton key={i} />
				))}
			</div>

			{/* Table placeholder */}
			<Card>
				<CardContent className="pt-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<TableRowSkeleton key={i} />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
