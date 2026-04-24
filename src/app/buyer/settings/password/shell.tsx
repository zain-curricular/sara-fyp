// ============================================================================
// Password Settings Shell — Client Component
// ============================================================================
//
// Re-authenticates with current password then calls supabase.auth.updateUser
// to set the new password. All three fields are required and new/confirm must
// match. Validation is done with react-hook-form + Zod.

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { Button } from "@/components/primitives/button";
import {
	Field,
	FieldLabel,
	FieldError,
	FieldDescription,
} from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "New password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Confirm your new password"),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type PasswordFormValues = z.infer<typeof passwordSchema>;

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function PasswordSettingsShell() {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<PasswordFormValues>({
		resolver: zodResolver(passwordSchema),
	});

	async function onSubmit(values: PasswordFormValues) {
		const supabase = createBrowserSupabaseClient();

		// 1 — Re-authenticate with current password
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			toast.error("Session expired. Please sign in again.");
			return;
		}

		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: user.email,
			password: values.currentPassword,
		});

		if (signInError) {
			toast.error("Current password is incorrect");
			return;
		}

		// 2 — Update to new password
		const { error: updateError } = await supabase.auth.updateUser({
			password: values.newPassword,
		});

		if (updateError) {
			toast.error(updateError.message ?? "Failed to update password");
			return;
		}

		toast.success("Password updated successfully");
		reset();
	}

	return (
		<div
			container-id="password-settings-shell"
			className="flex max-w-2xl flex-col gap-8"
		>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Change password
				</h1>
				<p className="text-sm text-muted-foreground">
					Enter your current password then choose a new one.
				</p>
			</header>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
				container-id="password-form"
			>
				{/* Current password */}
				<Field data-invalid={!!errors.currentPassword || undefined}>
					<FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
					<Input
						id="currentPassword"
						type="password"
						autoComplete="current-password"
						{...register("currentPassword")}
					/>
					{errors.currentPassword && (
						<FieldError>{errors.currentPassword.message}</FieldError>
					)}
				</Field>

				{/* New password */}
				<Field data-invalid={!!errors.newPassword || undefined}>
					<FieldLabel htmlFor="newPassword">New password</FieldLabel>
					<Input
						id="newPassword"
						type="password"
						autoComplete="new-password"
						{...register("newPassword")}
					/>
					<FieldDescription>At least 8 characters</FieldDescription>
					{errors.newPassword && (
						<FieldError>{errors.newPassword.message}</FieldError>
					)}
				</Field>

				{/* Confirm password */}
				<Field data-invalid={!!errors.confirmPassword || undefined}>
					<FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
					<Input
						id="confirmPassword"
						type="password"
						autoComplete="new-password"
						{...register("confirmPassword")}
					/>
					{errors.confirmPassword && (
						<FieldError>{errors.confirmPassword.message}</FieldError>
					)}
				</Field>

				<Button type="submit" className="w-fit" disabled={isSubmitting}>
					{isSubmitting ? "Updating…" : "Update password"}
				</Button>
			</form>
		</div>
	);
}
