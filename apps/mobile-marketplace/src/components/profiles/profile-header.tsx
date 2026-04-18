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
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
			<Avatar className="size-20">
				{profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="truncate text-2xl font-semibold tracking-tight">
						{profile.display_name ?? "Unnamed seller"}
					</h1>
					{profile.is_verified ? <Badge variant="secondary">Verified</Badge> : null}
					<Badge variant="outline" className="capitalize">
						{profile.role}
					</Badge>
				</div>
				{profile.handle ? <p className="text-sm text-muted-foreground">@{profile.handle}</p> : null}
			</div>
		</div>
	);
}
