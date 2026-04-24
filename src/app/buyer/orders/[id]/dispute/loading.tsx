import { Skeleton } from "@/components/primitives/skeleton";

export default function OpenDisputeLoading() {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-8">
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-44" />
				<Skeleton className="h-4 w-72" />
			</div>
			<Skeleton className="h-20 w-full rounded-xl" />
			<div className="flex flex-col gap-6">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}
