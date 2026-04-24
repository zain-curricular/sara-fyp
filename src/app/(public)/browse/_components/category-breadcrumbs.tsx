import Link from "next/link";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/primitives/separator";

type Crumb = {
	label: string;
	href?: string;
};

type CategoryBreadcrumbsProps = {
	items: Crumb[];
	className?: string;
};

export function CategoryBreadcrumbs({ items, className }: CategoryBreadcrumbsProps) {
	if (!items.length) return null;

	return (
		<nav className={cn("flex flex-wrap items-center gap-2 text-sm text-muted-foreground", className)}>
			{items.map((item, index) => (
				<span key={`${item.label}-${index}`} className="flex items-center gap-2">
					{item.href ? (
						<Link href={item.href} className="hover:text-foreground hover:underline">
							{item.label}
						</Link>
					) : (
						<span className="text-foreground">{item.label}</span>
					)}
					{index < items.length - 1 ? <Separator orientation="vertical" className="h-4" /> : null}
				</span>
			))}
		</nav>
	);
}
