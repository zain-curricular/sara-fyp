// ============================================================================
// Onboarding — Profile Shell
// ============================================================================
//
// Step 3 of 3: complete the user's profile. Shows avatar upload (optional),
// then a form for display name, city, handle, and locale. Phone is read-only
// (pre-filled from the verified number). Submits via useCompleteOnboarding().
//
// Avatar: triggers a hidden file input → uploadProfileAvatar → router.refresh().
// The step indicator is rendered by the parent onboarding layout.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";
import { Button } from "@/components/primitives/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";
import { Separator } from "@/components/primitives/separator";
import { ApiError } from "@/lib/api/client";
import { useCompleteOnboarding } from "@/lib/features/onboarding/hooks";
import { completeOnboardingSchema } from "@/lib/features/onboarding/schemas";
import type { OwnProfile } from "@/lib/features/profiles/types";
import { uploadProfileAvatar } from "@/lib/features/profiles/upload-avatar";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// z.preprocess makes the input type `unknown`; thread input/output separately so
// the resolver generic matches useForm's three-parameter signature.
type FormInput = z.input<typeof completeOnboardingSchema>;
type FormOutput = z.infer<typeof completeOnboardingSchema>;

/** Onboarding step 3: avatar + profile details form. */
export default function OnboardingProfileShell({
	profile,
	emailVerified,
}: {
	profile: OwnProfile;
	emailVerified: boolean;
}) {
	const router = useRouter();
	const complete = useCompleteOnboarding();
	const fileRef = useRef<HTMLInputElement>(null);
	const [avatarBusy, setAvatarBusy] = useState(false);

	const form = useForm<FormInput, unknown, FormOutput>({
		resolver: zodResolver(completeOnboardingSchema),
		defaultValues: {
			display_name: profile.display_name ?? "",
			phone_number: profile.phone_number ?? "",
			city: profile.city ?? "",
			handle: profile.handle ?? "",
			locale: profile.locale === "ur" ? "ur" : "en",
		},
	});

	const initials = (profile.display_name ?? profile.handle ?? "?")
		.split(/\s+/)
		.map((s) => s[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	async function onAvatarFile(file: File) {
		setAvatarBusy(true);
		try {
			const supabase = createBrowserSupabaseClient();
			const { data: { session } } = await supabase.auth.getSession();
			await uploadProfileAvatar(session?.access_token, file);
			router.refresh();
			toast.success("Photo updated");
		} catch (e) {
			if (e instanceof ApiError && e.status === 401) {
				router.push("/sign-in");
				return;
			}
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setAvatarBusy(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	}

	return (
		<div
			container-id="onboarding-profile-card"
			className="w-full max-w-xl space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
		>

			{/* Heading */}
			<div container-id="onboarding-profile-header" className="space-y-1">
				<h1 className="text-xl font-bold tracking-tight">Finish your profile</h1>
				<p className="text-sm text-muted-foreground">
					Visible to other users — helps build trust with buyers and sellers.
				</p>
			</div>

			{/* Avatar upload */}
			<div
				container-id="onboarding-profile-avatar"
				className="flex items-center gap-5"
			>
				<Avatar className="size-20 shrink-0 text-lg">
					{profile.avatar_url ? <AvatarImage alt="" src={profile.avatar_url} /> : null}
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-2">
					<input
						ref={fileRef}
						accept="image/jpeg,image/png,image/webp,image/gif"
						className="sr-only"
						type="file"
						onChange={(ev) => {
							const file = ev.target.files?.[0];
							if (file) void onAvatarFile(file);
						}}
					/>
					<Button
						disabled={avatarBusy}
						type="button"
						variant="outline"
						size="sm"
						onClick={() => fileRef.current?.click()}
					>
						{avatarBusy ? "Uploading…" : "Upload photo"}
					</Button>
					<p className="text-xs text-muted-foreground">Optional · JPEG, PNG, WebP or GIF</p>
				</div>
			</div>

			<Separator />

			{/* Profile form */}
			<form
				container-id="onboarding-profile-form"
				className="space-y-5"
				onSubmit={form.handleSubmit((values) => {
					complete.mutate(completeOnboardingSchema.parse(values));
				})}
			>
				<FieldSet>
					<FieldGroup>

						<div className="flex flex-col gap-1">
							<h2 className="text-xs font-medium text-muted-foreground">Your details</h2>
							<Separator />
						</div>

						<Field data-invalid={!!form.formState.errors.display_name}>
							<FieldLabel htmlFor="display_name">Display name</FieldLabel>
							<Input id="display_name" placeholder="Your name" {...form.register("display_name")} />
							<FieldError errors={[form.formState.errors.display_name]} />
						</Field>

						<Field data-invalid={!!form.formState.errors.phone_number}>
							<FieldLabel htmlFor="phone_number">Phone</FieldLabel>
							{profile.phone_verified ? (
								<FieldDescription>Pre-filled from your verified number.</FieldDescription>
							) : emailVerified ? (
								<FieldDescription>
									Optional — your email is verified. Use international format (e.g. +923001234567) or
									leave blank.
								</FieldDescription>
							) : (
								<FieldDescription>Verify your number on the previous steps first.</FieldDescription>
							)}
							<Input
								readOnly={profile.phone_verified}
								className={profile.phone_verified ? "bg-muted" : undefined}
								id="phone_number"
								placeholder={emailVerified && !profile.phone_verified ? "+923001234567" : undefined}
								{...form.register("phone_number")}
							/>
							<FieldError errors={[form.formState.errors.phone_number]} />
						</Field>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field data-invalid={!!form.formState.errors.city}>
								<FieldLabel htmlFor="city">City</FieldLabel>
								<Input id="city" placeholder="e.g. Karachi" {...form.register("city")} />
								<FieldError errors={[form.formState.errors.city]} />
							</Field>
							<Field data-invalid={!!form.formState.errors.handle}>
								<FieldLabel htmlFor="handle">Handle</FieldLabel>
								<FieldDescription>Lowercase, 3–30 chars. Optional.</FieldDescription>
								<Input
									autoComplete="username"
									id="handle"
									placeholder="your_handle"
									{...form.register("handle")}
								/>
								<FieldError errors={[form.formState.errors.handle]} />
							</Field>
						</div>

						<Field data-invalid={!!form.formState.errors.locale}>
							<FieldLabel htmlFor="locale">Preferred language</FieldLabel>
							<Controller
								control={form.control}
								name="locale"
								render={({ field }) => (
									<Select value={field.value ?? "en"} onValueChange={(v) => field.onChange(v)}>
										<SelectTrigger className="w-full min-w-0" id="locale">
											<SelectValue placeholder="Language" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="en">English</SelectItem>
											<SelectItem value="ur">Urdu</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							<FieldError errors={[form.formState.errors.locale]} />
						</Field>

					</FieldGroup>
				</FieldSet>

				<Button disabled={complete.isPending} type="submit">
					{complete.isPending ? "Saving…" : "Complete setup →"}
				</Button>
			</form>
		</div>
	);
}
