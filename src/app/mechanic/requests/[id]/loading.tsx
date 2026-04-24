import { Skeleton } from "@/components/primitives/skeleton";

export default function MechanicRequestDetailLoading() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-8 w-64" />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="flex flex-col gap-4">
					<Skeleton className="aspect-video rounded-xl" />
					<Skeleton className="h-40 rounded-xl" />
				</div>
				<Skeleton className="h-80 rounded-xl" />
			</div>
		</div>
	);
}
