import Link from "next/link";

import type { Model } from "@/lib/features/product-catalog";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type ModelCardProps = {
	model: Model;
	href: string;
	className?: string;
};

export function ModelCard({ model, href, className }: ModelCardProps) {
	return (
		<Link href={href} className="group block focus:outline-none">
			<Card
				size="sm"
				className={cn(
					"h-full cursor-pointer transition-all group-hover:border-foreground/20 group-hover:bg-accent/40 group-hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring",
					className,
				)}
			>
				<CardHeader>
					<CardTitle className="text-base">{model.name}</CardTitle>
				</CardHeader>
				<CardContent>
					{model.year ? (
						<p className="text-sm text-muted-foreground">{model.year}</p>
					) : (
						<p className="text-sm text-muted-foreground">View listings</p>
					)}
				</CardContent>
			</Card>
		</Link>
	);
}
