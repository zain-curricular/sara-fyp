import { Skeleton } from "@/components/primitives/skeleton";
import { Separator } from "@/components/primitives/separator";

export default function DisputeDetailLoading() {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6">
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
				<Skeleton className="h-4 w-40" />
			</div>

			<Separator />

			<div className="flex flex-col gap-2">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>

			<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
				<Skeleton className="aspect-square rounded-md" />
				<Skeleton className="aspect-square rounded-md" />
				<Skeleton className="aspect-square rounded-md" />
			</div>

			<Skeleton className="h-20 w-full rounded-xl" />
			<Skeleton className="h-9 w-36" />
		</div>
	);
}
