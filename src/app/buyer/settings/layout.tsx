import Link from "next/link";

import { Separator } from "@/components/primitives/separator";

const linkClass = "text-sm font-medium text-muted-foreground hover:text-foreground";

export default function BuyerSettingsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			container-id="buyer-settings-layout"
			className="flex flex-col gap-8 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-12"
		>
			<nav
				aria-label="Settings"
				container-id="buyer-settings-nav"
				className="lg:sticky lg:top-24"
			>
				<p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					Settings
				</p>
				<ul className="flex flex-col gap-2.5">
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
					<li>
						<Link className={linkClass} href="/buyer/addresses">
							Addresses
						</Link>
					</li>
					<li>
						<Link className={linkClass} href="/buyer/settings/password">
							Password
						</Link>
					</li>
					<li>
						<Link className={linkClass} href="/buyer/settings/notifications">
							Notifications
						</Link>
					</li>
				</ul>
				<Separator className="mt-4 lg:hidden" />
			</nav>
			<div container-id="buyer-settings-main" className="min-w-0">
				{children}
			</div>
		</div>
	);
}
