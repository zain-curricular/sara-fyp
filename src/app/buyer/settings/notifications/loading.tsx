import { Skeleton } from "@/components/primitives/skeleton";

export default function NotificationsSettingsLoading() {
	return (
		<div className="flex max-w-2xl flex-col gap-8">
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-36" />
				<Skeleton className="h-4 w-56" />
			</div>
			<div className="flex flex-col gap-6">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex flex-col gap-3">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-12 w-full rounded-lg" />
						<Skeleton className="h-12 w-full rounded-lg" />
					</div>
				))}
			</div>
		</div>
	);
}
