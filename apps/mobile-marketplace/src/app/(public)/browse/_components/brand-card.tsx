import Link from "next/link";

import type { Brand } from "@/lib/features/product-catalog";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type BrandCardProps = {
	brand: Brand;
	href: string;
	className?: string;
};

export function BrandCard({ brand, href, className }: BrandCardProps) {
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
					<CardTitle className="text-base">{brand.name}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">Browse {brand.name} models</p>
				</CardContent>
			</Card>
		</Link>
	);
}
