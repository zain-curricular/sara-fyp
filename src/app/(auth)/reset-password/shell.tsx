// ============================================================================
// Reset Password Shell
// ============================================================================
//
// Receives the Supabase `code` from the URL (passed from the RSC page).
// On mount, exchanges the code for a session via exchangeCodeForSession.
// Then presents a new-password + confirm form and calls supabase.auth.updateUser.
//
// States:
//   - exchanging: spinner while code is being consumed
//   - invalid:    code missing or exchange failed — prompt to request new link
//   - ready:      form visible, user can set password
//   - done:       success state with redirect link

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Skeleton } from "@/components/primitives/skeleton";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const resetSchema = z
	.object({
		password: z.string().min(8, "Use at least 8 characters"),
		confirm: z.string().min(1, "Confirm your password"),
	})
	.refine((d) => d.password === d.confirm, {
		message: "Passwords must match",
		path: ["confirm"],
	});

type ResetForm = z.infer<typeof resetSchema>;

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

interface ResetPasswordShellProps {
	code?: string;
}

/** New-password form gated behind Supabase code exchange. */
export default function ResetPasswordShell({ code }: ResetPasswordShellProps) {
	const router = useRouter();
	const [status, setStatus] = useState<"exchanging" | "invalid" | "ready" | "done">(
		code ? "exchanging" : "invalid",
	);

	const form = useForm<ResetForm>({
		resolver: zodResolver(resetSchema),
		defaultValues: { password: "", confirm: "" },
	});

	// Exchange the code for a session on mount
	useEffect(() => {
		if (!code) return;

		const supabase = createBrowserSupabaseClient();

		supabase.auth
			.exchangeCodeForSession(code)
			.then(({ error }) => {
				if (error) {
					setStatus("invalid");
				} else {
					setStatus("ready");
				}
			})
			.catch(() => setStatus("invalid"));
	}, [code]);

	async function onSubmit({ password }: ResetForm) {
		const supabase = createBrowserSupabaseClient();

		const { error } = await supabase.auth.updateUser({ password });
		if (error) {
			toast.error(error.message);
			return;
		}

		setStatus("done");
	}

	// -- Exchanging code --
	if (status === "exchanging") {
		return (
			<div
				container-id="reset-password-exchanging"
				className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
			>
				<Skeleton className="mx-auto h-7 w-48" />
				<Skeleton className="mx-auto h-4 w-64" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}

	// -- Invalid or missing code --
	if (status === "invalid") {
		return (
			<div container-id="reset-password-invalid" className="w-full max-w-md">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Link expired or invalid</CardTitle>
						<CardDescription>
							This password reset link has expired or already been used.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<Link href="/forgot-password">
							<Button className="w-full" type="button">
								Request a new link
							</Button>
						</Link>
						<Link
							href="/login"
							className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Back to log in
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	// -- Done --
	if (status === "done") {
		return (
			<div container-id="reset-password-done" className="w-full max-w-md">
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
							<svg
								aria-hidden
								className="size-6 text-primary"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<CardTitle>Password updated</CardTitle>
						<CardDescription>
							Your new password has been saved. You can now sign in.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button className="w-full" onClick={() => router.push("/login")} type="button">
							Go to log in
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// -- Ready — show form --
	return (
		<div container-id="reset-password-shell" className="w-full max-w-md">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold tracking-tight">Set new password</CardTitle>
					<CardDescription>Choose a strong password for your account.</CardDescription>
				</CardHeader>

				<CardContent>
					<form
						container-id="reset-password-form"
						className="flex flex-col gap-4"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						<FieldSet>
							<FieldGroup>

								<Field data-invalid={!!form.formState.errors.password}>
									<FieldLabel htmlFor="rp_password">New password</FieldLabel>
									<Input
										autoComplete="new-password"
										id="rp_password"
										type="password"
										placeholder="8+ characters"
										{...form.register("password")}
									/>
									<FieldError errors={[form.formState.errors.password]} />
								</Field>

								<Field data-invalid={!!form.formState.errors.confirm}>
									<FieldLabel htmlFor="rp_confirm">Confirm password</FieldLabel>
									<Input
										autoComplete="new-password"
										id="rp_confirm"
										type="password"
										{...form.register("confirm")}
									/>
									<FieldError errors={[form.formState.errors.confirm]} />
								</Field>

							</FieldGroup>
						</FieldSet>

						<Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
							{form.formState.isSubmitting ? "Updating…" : "Update password"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
