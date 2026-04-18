"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { Skeleton } from "@/components/primitives/skeleton";
import { EditProfileForm } from "@/components/profiles/edit-profile-form";
import { useMyProfile } from "@/lib/features/profiles/hooks";
import { cn } from "@/lib/utils";

export default function ProfileSettingsShell() {
	const q = useMyProfile();

	if (q.isLoading) {
		return (
			<div className="flex max-w-xl flex-col gap-6">
				<Skeleton className="h-8 w-48" />
				<div className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-24 w-full" />
				</div>
			</div>
		);
	}

	if (q.isError) {
		return (
			<div className="rounded-lg border border-border bg-card p-6">
				<h2 className="text-lg font-semibold">Could not load profile</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					{q.error instanceof Error ? q.error.message : "Something went wrong."}
				</p>
				<button
					className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
					type="button"
					onClick={() => q.refetch()}
				>
					Try again
				</button>
			</div>
		);
	}

	if (!q.data) {
		return (
			<p className="text-sm text-muted-foreground">
				No profile data.{" "}
				<Link className="text-foreground underline underline-offset-4" href="/login">
					Sign in
				</Link>
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
				<p className="text-sm text-muted-foreground">Update how you appear on the marketplace.</p>
			</div>
			<EditProfileForm profile={q.data} />
		</div>
	);
}
