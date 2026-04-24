import { Skeleton } from "@/components/primitives/skeleton";

export default function NewAddressLoading() {
	return (
		<div className="flex max-w-2xl flex-col gap-8">
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="flex flex-col gap-6">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}
