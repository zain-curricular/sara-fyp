import { Skeleton } from "@/components/primitives/skeleton";

export default function ContinueLoading() {
	return (
		<div className="flex flex-col items-center gap-4">
			<Skeleton className="size-10 rounded-full" />
			<Skeleton className="h-4 w-40" />
		</div>
	);
}
