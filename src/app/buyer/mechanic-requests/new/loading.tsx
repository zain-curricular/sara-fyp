import { Skeleton } from "@/components/primitives/skeleton";

export default function NewMechanicRequestLoading() {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-8">
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-64" />
				<Skeleton className="h-4 w-80" />
			</div>
			<Skeleton className="h-20 w-full rounded-xl" />
			<div className="flex flex-col gap-6">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-16 w-full rounded-lg" />
				<Skeleton className="h-5 w-56" />
				<Skeleton className="h-10 w-36" />
			</div>
		</div>
	);
}
