import { Skeleton } from "@/components/primitives/skeleton";

export default function ConfirmReceiptLoading() {
	return (
		<div className="mx-auto flex max-w-lg flex-col gap-6">
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-44" />
				<Skeleton className="h-4 w-72" />
			</div>
			<Skeleton className="h-24 w-full rounded-xl" />
			<Skeleton className="h-16 w-full rounded-lg" />
			<div className="flex gap-2">
				<Skeleton className="h-10 flex-1" />
				<Skeleton className="h-10 w-24" />
			</div>
		</div>
	);
}
