import { Skeleton } from "@/components/primitives/skeleton";

export default function PublicHomeLoading() {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-3">
				<Skeleton className="h-9 w-64 max-w-full" />
				<Skeleton className="h-4 w-full max-w-xl" />
				<Skeleton className="h-4 w-full max-w-lg" />
			</div>
			<div className="flex flex-wrap gap-3">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-9 w-40" />
			</div>
		</div>
	);
}
