import Link from "next/link";

import { Separator } from "@/components/primitives/separator";

const linkClass = "text-sm font-medium text-muted-foreground hover:text-foreground";

export default function BuyerSettingsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-8 lg:flex-row">
			<nav aria-label="Settings" className="lg:w-52 lg:shrink-0">
				<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Settings
				</p>
				<ul className="flex flex-col gap-2">
					<li>
						<Link className={linkClass} href="/buyer/settings/profile">
							Profile
						</Link>
					</li>
					<li>
						<Link className={linkClass} href="/buyer/settings/avatar">
							Avatar
						</Link>
					</li>
				</ul>
				<Separator className="my-4 lg:hidden" />
			</nav>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
