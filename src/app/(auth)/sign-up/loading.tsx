import { Skeleton } from "@/components/primitives/skeleton";

export default function SignUpLoading() {
	return (
		<div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
			<div className="flex flex-col gap-5 p-6 sm:p-8">
				<Skeleton className="h-5 w-24" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-7 w-48" />
				</div>
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		</div>
	);
}
