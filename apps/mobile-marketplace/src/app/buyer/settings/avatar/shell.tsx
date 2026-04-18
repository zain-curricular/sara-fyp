"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";
import { Button } from "@/components/primitives/button";
import { ApiError } from "@/lib/api/client";
import type { OwnProfile } from "@/lib/features/profiles/types";
import { uploadProfileAvatar } from "@/lib/features/profiles/upload-avatar";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AvatarSettingsShell({ profile }: { profile: OwnProfile }) {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);

	const initials = (profile.display_name ?? profile.handle ?? "?")
		.split(/\s+/)
		.map((s) => s[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	async function onPickFile(file: File) {
		setBusy(true);
		try {
			const supabase = createBrowserSupabaseClient();
			const {
				data: { session },
			} = await supabase.auth.getSession();
			const token = session?.access_token;
			await uploadProfileAvatar(token, file);
			router.refresh();
			toast.success("Avatar updated");
		} catch (e) {
			if (e instanceof ApiError && e.status === 401) {
				router.push("/login");
				return;
			}
			const msg = e instanceof Error ? e.message : "Upload failed";
			toast.error(msg);
		} finally {
			setBusy(false);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Avatar</h1>
				<p className="text-sm text-muted-foreground">Upload a new profile picture.</p>
			</div>
			<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
				<Avatar className="size-32 text-lg">
					{profile.avatar_url ? <AvatarImage alt="" src={profile.avatar_url} /> : null}
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-3">
					<input
						ref={inputRef}
						accept="image/jpeg,image/png,image/webp,image/gif"
						className="sr-only"
						type="file"
						onChange={(ev) => {
							const file = ev.target.files?.[0];
							if (file) {
								void onPickFile(file);
							}
						}}
					/>
					<Button
						disabled={busy}
						type="button"
						variant="outline"
						onClick={() => inputRef.current?.click()}
					>
						{busy ? "Uploading…" : "Choose image"}
					</Button>
					<p className="text-xs text-muted-foreground">
						JPEG, PNG, WebP, or GIF. Max size per API limits.
					</p>
				</div>
			</div>
		</div>
	);
}
