"use client";

import { EditProfileForm } from "@/components/profiles/edit-profile-form";
import type { OwnProfile } from "@/lib/features/profiles/types";

export default function ProfileSettingsShell({ profile }: { profile: OwnProfile }) {
	return (
		<div container-id="profile-settings-shell" className="flex max-w-2xl flex-col gap-8">
			<header className="flex flex-col gap-1">
				<h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
				<p className="text-sm text-muted-foreground">
					Update how you appear on the marketplace.
				</p>
			</header>
			<EditProfileForm key={profile.updated_at} profile={profile} />
		</div>
	);
}
