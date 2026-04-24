import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

export default function ListingDetailLoading() {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-2">
				<div className="flex flex-wrap gap-2">
					<Skeleton className="h-5 w-16 rounded-full" />
					<Skeleton className="h-5 w-20 rounded-full" />
					<Skeleton className="h-5 w-24 rounded-full" />
				</div>
				<Skeleton className="h-10 w-full max-w-xl" />
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-48" />
			</div>
			<Skeleton className="aspect-[4/3] w-full rounded-xl" />
			<Card size="sm">
				<CardHeader>
					<Skeleton className="h-5 w-28" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-20 w-full" />
				</CardContent>
			</Card>
			<Card size="sm">
				<CardHeader>
					<Skeleton className="h-5 w-32" />
				</CardHeader>
				<CardContent className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 max-w-[75%]" />
				</CardContent>
			</Card>
			<div className="flex flex-wrap gap-3">
				<Skeleton className="h-9 w-28" />
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-9 w-36" />
			</div>
		</div>
	);
}
