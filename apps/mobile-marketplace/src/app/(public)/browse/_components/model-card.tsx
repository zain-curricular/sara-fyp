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
		<Link href={href} className="block">
			<Card
				size="sm"
				className={cn("cursor-pointer transition-colors hover:bg-accent/40", className)}
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
