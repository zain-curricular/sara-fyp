import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

export default function BuyerOrderReviewLoading() {
	return (
		<div className="flex max-w-lg flex-col gap-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			<Card size="sm">
				<CardHeader>
					<Skeleton className="h-5 w-24" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-10 w-40" />
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-9 w-36" />
				</CardContent>
			</Card>
		</div>
	);
}
