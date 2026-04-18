"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, Controller, useForm } from "react-hook-form";

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
import { Textarea } from "@/components/primitives/textarea";
import { useUpdateProfile } from "@/lib/features/profiles/hooks";
import {
	type UpdateOwnProfileInput,
	updateOwnProfileSchema,
} from "@/lib/features/profiles/schemas";
import type { OwnProfile } from "@/lib/features/profiles/types";

function toFormDefaults(profile: OwnProfile): UpdateOwnProfileInput {
	return {
		display_name: profile.display_name ?? undefined,
		handle: profile.handle ?? undefined,
		phone_number: profile.phone_number ?? undefined,
		city: profile.city ?? undefined,
		area: profile.area ?? undefined,
		bio: profile.bio ?? undefined,
		locale: profile.locale === "en" || profile.locale === "ur" ? profile.locale : undefined,
	};
}

function stripEmpty(input: UpdateOwnProfileInput): UpdateOwnProfileInput {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(input)) {
		if (v === undefined || v === "") {
			continue;
		}
		out[k] = v;
	}
	return out as UpdateOwnProfileInput;
}

export function EditProfileForm({ profile }: { profile: OwnProfile }) {
	const update = useUpdateProfile();

	const form = useForm<UpdateOwnProfileInput>({
		resolver: zodResolver(updateOwnProfileSchema) as Resolver<UpdateOwnProfileInput>,
		defaultValues: toFormDefaults(profile),
	});

	return (
		<form
			className="flex max-w-xl flex-col gap-8"
			onSubmit={form.handleSubmit((values) => {
				update.mutate(stripEmpty(values));
			})}
		>
			<FieldSet>
				<FieldGroup>
					<div className="flex flex-col gap-1">
						<h2 className="text-xs font-medium text-muted-foreground">Profile</h2>
						<Separator />
					</div>
					<Field data-invalid={!!form.formState.errors.display_name}>
						<FieldLabel htmlFor="display_name">Display name</FieldLabel>
						<Input id="display_name" {...form.register("display_name")} />
						<FieldError errors={[form.formState.errors.display_name]} />
					</Field>
					<Field data-invalid={!!form.formState.errors.handle}>
						<FieldLabel htmlFor="handle">Handle</FieldLabel>
						<FieldDescription>Lowercase letters, numbers, underscore (3–30).</FieldDescription>
						<Input id="handle" {...form.register("handle")} />
						<FieldError errors={[form.formState.errors.handle]} />
					</Field>
					<Field data-invalid={!!form.formState.errors.phone_number}>
						<FieldLabel htmlFor="phone_number">Phone (E.164)</FieldLabel>
						<FieldDescription>Example: +923001234567</FieldDescription>
						<Input id="phone_number" type="tel" {...form.register("phone_number")} />
						<FieldError errors={[form.formState.errors.phone_number]} />
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<Field data-invalid={!!form.formState.errors.city}>
							<FieldLabel htmlFor="city">City</FieldLabel>
							<Input id="city" {...form.register("city")} />
							<FieldError errors={[form.formState.errors.city]} />
						</Field>
						<Field data-invalid={!!form.formState.errors.area}>
							<FieldLabel htmlFor="area">Area</FieldLabel>
							<Input id="area" {...form.register("area")} />
							<FieldError errors={[form.formState.errors.area]} />
						</Field>
					</div>
					<Field data-invalid={!!form.formState.errors.bio}>
						<FieldLabel htmlFor="bio">Bio</FieldLabel>
						<Textarea id="bio" rows={4} {...form.register("bio")} />
						<FieldError errors={[form.formState.errors.bio]} />
					</Field>
					<Field data-invalid={!!form.formState.errors.locale}>
						<FieldLabel htmlFor="locale">Locale</FieldLabel>
						<Controller
							control={form.control}
							name="locale"
							render={({ field }) => (
								<Select
									value={field.value ?? ""}
									onValueChange={(v) => field.onChange(v === "" ? undefined : v)}
								>
									<SelectTrigger id="locale" className="w-full min-w-0">
										<SelectValue placeholder="Select locale" />
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
			<Button disabled={update.isPending} type="submit">
				{update.isPending ? "Saving…" : "Save changes"}
			</Button>
		</form>
	);
}
