import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

export default function NewListingLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-1">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			<Card size="sm">
				<CardHeader>
					<Skeleton className="h-5 w-48" />
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-32 w-full" />
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-9 w-24" />
						<Skeleton className="h-9 w-24" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
