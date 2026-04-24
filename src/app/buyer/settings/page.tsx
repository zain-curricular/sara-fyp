// ============================================================================
// Buyer Settings Hub — RSC
// ============================================================================
//
// Central hub for all buyer settings. Lists available settings sections as
// navigable links. Auth-gated.

import { redirect } from "next/navigation";
import Link from "next/link";
import {
	User,
	ImageIcon,
	MapPin,
	Lock,
	Bell,
} from "lucide-react";

import { getServerSession } from "@/lib/auth/guards";

const SETTINGS_LINKS = [
	{
		href: "/buyer/settings/profile",
		icon: User,
		label: "Profile",
		description: "Update your name and bio",
	},
	{
		href: "/buyer/settings/avatar",
		icon: ImageIcon,
		label: "Avatar",
		description: "Change your profile picture",
	},
	{
		href: "/buyer/addresses",
		icon: MapPin,
		label: "Addresses",
		description: "Manage saved delivery addresses",
	},
	{
		href: "/buyer/settings/password",
		icon: Lock,
		label: "Password",
		description: "Change your account password",
	},
	{
		href: "/buyer/settings/notifications",
		icon: Bell,
		label: "Notifications",
		description: "Manage email and in-app notifications",
	},
];

export default async function BuyerSettingsHubPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/settings");

	return (
		<div
			container-id="settings-hub"
			className="flex max-w-2xl flex-col gap-8"
		>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Manage your account preferences.
				</p>
			</header>

			<ul
				container-id="settings-link-list"
				className="flex flex-col gap-2"
			>
				{SETTINGS_LINKS.map(({ href, icon: Icon, label, description }) => (
					<li key={href}>
						<Link
							href={href}
							className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent/50"
						>
							<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
								<Icon className="size-4 text-muted-foreground" />
							</span>
							<div className="flex flex-col gap-0.5">
								<span className="font-medium">{label}</span>
								<span className="text-xs text-muted-foreground">{description}</span>
							</div>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
