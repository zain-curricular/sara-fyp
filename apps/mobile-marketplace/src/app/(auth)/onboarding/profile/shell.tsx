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
import { useCompleteOnboarding } from "@/lib/features/onboarding/hooks";
import { completeOnboardingSchema } from "@/lib/features/onboarding/schemas";
import { ApiError } from "@/lib/api/client";
import type { OwnProfile } from "@/lib/features/profiles/types";
import { uploadProfileAvatar } from "@/lib/features/profiles/upload-avatar";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type FormValues = z.input<typeof completeOnboardingSchema>;

export default function OnboardingProfileShell({ profile }: { profile: OwnProfile }) {
	const router = useRouter();
	const complete = useCompleteOnboarding();
	const fileRef = useRef<HTMLInputElement>(null);
	const [avatarBusy, setAvatarBusy] = useState(false);

	const form = useForm<FormValues>({
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
			const {
				data: { session },
			} = await supabase.auth.getSession();
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
			if (fileRef.current) {
				fileRef.current.value = "";
			}
		}
	}

	return (
		<div
			container-id="onboarding-profile-card"
			className="w-full max-w-xl space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
		>
			<div container-id="onboarding-profile-header" className="space-y-2 text-center sm:text-left">
				<h1 className="text-2xl font-semibold tracking-tight">Finish your profile</h1>
				<p className="text-sm text-muted-foreground">
					This information is shown to other users on the marketplace.
				</p>
			</div>

			<div
				container-id="onboarding-profile-avatar"
				className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6"
			>
				<Avatar className="size-24 text-lg">
					{profile.avatar_url ? <AvatarImage alt="" src={profile.avatar_url} /> : null}
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col items-center gap-2 sm:items-start">
					<input
						ref={fileRef}
						accept="image/jpeg,image/png,image/webp,image/gif"
						className="sr-only"
						type="file"
						onChange={(ev) => {
							const file = ev.target.files?.[0];
							if (file) {
								void onAvatarFile(file);
							}
						}}
					/>
					<Button
						disabled={avatarBusy}
						type="button"
						variant="outline"
						onClick={() => fileRef.current?.click()}
					>
						{avatarBusy ? "Uploading…" : "Upload photo"}
					</Button>
					<p className="text-xs text-muted-foreground">Optional — JPEG, PNG, WebP, or GIF.</p>
				</div>
			</div>

			<form
				className="space-y-6"
				onSubmit={form.handleSubmit((values) => {
					complete.mutate(completeOnboardingSchema.parse(values));
				})}
			>
				<FieldSet>
					<FieldGroup>
						<div className="flex flex-col gap-1">
							<h2 className="text-xs font-medium text-muted-foreground">Details</h2>
							<Separator />
						</div>
						<Field data-invalid={!!form.formState.errors.display_name}>
							<FieldLabel htmlFor="display_name">Display name</FieldLabel>
							<Input id="display_name" {...form.register("display_name")} />
							<FieldError errors={[form.formState.errors.display_name]} />
						</Field>
						<Field data-invalid={!!form.formState.errors.phone_number}>
							<FieldLabel htmlFor="phone_number">Phone</FieldLabel>
							<FieldDescription>Must match your verified number.</FieldDescription>
							<Input
								readOnly
								className="bg-muted"
								id="phone_number"
								{...form.register("phone_number")}
							/>
							<FieldError errors={[form.formState.errors.phone_number]} />
						</Field>
						<Field data-invalid={!!form.formState.errors.city}>
							<FieldLabel htmlFor="city">City</FieldLabel>
							<Input id="city" {...form.register("city")} />
							<FieldError errors={[form.formState.errors.city]} />
						</Field>
						<Field data-invalid={!!form.formState.errors.handle}>
							<FieldLabel htmlFor="handle">Handle</FieldLabel>
							<FieldDescription>
								Lowercase letters, numbers, underscore (3–30). Optional.
							</FieldDescription>
							<Input
								autoComplete="username"
								id="handle"
								placeholder="your_handle"
								{...form.register("handle")}
							/>
							<FieldError errors={[form.formState.errors.handle]} />
						</Field>
						<Field data-invalid={!!form.formState.errors.locale}>
							<FieldLabel htmlFor="locale">Locale</FieldLabel>
							<Controller
								control={form.control}
								name="locale"
								render={({ field }) => (
									<Select value={field.value ?? "en"} onValueChange={(v) => field.onChange(v)}>
										<SelectTrigger className="w-full min-w-0" id="locale">
											<SelectValue placeholder="Locale" />
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
				<Button className="w-full sm:w-auto" disabled={complete.isPending} type="submit">
					{complete.isPending ? "Saving…" : "Complete setup"}
				</Button>
			</form>
		</div>
	);
}
