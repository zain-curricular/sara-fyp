import { Badge } from "@/components/primitives/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";

export type ProfileHeaderModel = {
	display_name: string | null;
	handle: string | null;
	avatar_url: string | null;
	is_verified: boolean;
	role: string;
};

export function ProfileHeader({ profile }: { profile: ProfileHeaderModel }) {
	const initials = (profile.display_name ?? profile.handle ?? "?")
		.split(/\s+/)
		.map((s) => s[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<div
			container-id="profile-header"
			className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-7 sm:text-left"
		>
			<Avatar className="size-24 sm:size-20">
				{profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<div container-id="profile-header-meta" className="flex min-w-0 flex-1 flex-col gap-1.5">
				<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
					<h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
						{profile.display_name ?? "Unnamed seller"}
					</h1>
					{profile.is_verified ? <Badge variant="secondary">Verified</Badge> : null}
					<Badge variant="outline" className="capitalize">
						{profile.role}
					</Badge>
				</div>
				{profile.handle ? (
					<p className="text-sm text-muted-foreground">@{profile.handle}</p>
				) : null}
			</div>
		</div>
	);
}
