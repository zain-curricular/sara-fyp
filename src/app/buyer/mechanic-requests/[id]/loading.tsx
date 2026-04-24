import { Skeleton } from "@/components/primitives/skeleton";
import { Separator } from "@/components/primitives/separator";

export default function MechanicRequestDetailLoading() {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6">
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<Skeleton className="h-7 w-52" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
				<Skeleton className="h-4 w-36" />
			</div>
			<Separator />
			<Skeleton className="h-24 w-full rounded-xl" />
			<Skeleton className="h-24 w-full rounded-xl" />
			<Skeleton className="h-16 w-full rounded-xl" />
			<Skeleton className="h-12 w-full rounded-lg" />
			<Skeleton className="h-9 w-36" />
		</div>
	);
}
