import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

const navLinkClass =
	"text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
			<div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
				<Link href="/" className="text-sm font-semibold tracking-tight">
					Mobile marketplace
				</Link>
				<nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
					<Link className={navLinkClass} href="/">
						Browse
					</Link>
					<Link className={navLinkClass} href="/seller">
						Sell
					</Link>
					<Link className={navLinkClass} href="/buyer">
						Buy
					</Link>
				</nav>
				<div className="flex items-center gap-2">
					<Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/login">
						Sign in
					</Link>
				</div>
			</div>
		</header>
	);
}
