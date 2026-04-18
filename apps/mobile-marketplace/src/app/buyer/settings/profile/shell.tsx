"use client";

import { EditProfileForm } from "@/components/profiles/edit-profile-form";
import type { OwnProfile } from "@/lib/features/profiles/types";

export default function ProfileSettingsShell({ profile }: { profile: OwnProfile }) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
				<p className="text-sm text-muted-foreground">Update how you appear on the marketplace.</p>
			</div>
			<EditProfileForm key={profile.updated_at} profile={profile} />
		</div>
	);
}
