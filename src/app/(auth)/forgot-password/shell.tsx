// ============================================================================
// Forgot Password Shell
// ============================================================================
//
// Email form that calls POST /api/auth/forgot-password. On success shows a
// confirmation message so the user knows to check their inbox.
//
// No session state required — works for unauthenticated users.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const forgotSchema = z.object({
	email: z.string().email("Enter a valid email"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Forgot-password email form with success state. */
export default function ForgotPasswordShell() {
	const [sent, setSent] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm<ForgotForm>({
		resolver: zodResolver(forgotSchema),
		defaultValues: { email: "" },
	});

	async function onSubmit({ email }: ForgotForm) {
		setServerError(null);

		const res = await fetch("/api/auth/forgot-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});

		const json = await res.json();

		if (!json.ok) {
			setServerError(json.error ?? "Something went wrong. Try again.");
			return;
		}

		setSent(true);
	}

	// Success state
	if (sent) {
		return (
			<div container-id="forgot-password-success" className="w-full max-w-md">
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
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<CardTitle>Check your inbox</CardTitle>
						<CardDescription>
							If an account exists for that email, we sent a reset link. It expires in 1 hour.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<p className="text-center text-xs text-muted-foreground">
							Didn't receive it? Check your spam folder, then{" "}
							<button
								type="button"
								onClick={() => setSent(false)}
								className="font-medium text-foreground hover:text-primary transition-colors"
							>
								try again
							</button>
							.
						</p>
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

	return (
		<div container-id="forgot-password-shell" className="w-full max-w-md">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold tracking-tight">Forgot your password?</CardTitle>
					<CardDescription>
						Enter your email and we'll send you a reset link.
					</CardDescription>
				</CardHeader>

				<CardContent className="flex flex-col gap-5">

					<form
						container-id="forgot-password-form"
						className="flex flex-col gap-4"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						<FieldSet>
							<FieldGroup>
								<Field data-invalid={!!form.formState.errors.email}>
									<FieldLabel htmlFor="fp_email">Email address</FieldLabel>
									<Input
										autoComplete="email"
										id="fp_email"
										type="email"
										placeholder="you@example.com"
										{...form.register("email")}
									/>
									<FieldError errors={[form.formState.errors.email]} />
								</Field>
							</FieldGroup>
						</FieldSet>

						{serverError && (
							<p className="text-sm text-destructive">{serverError}</p>
						)}

						<Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
							{form.formState.isSubmitting ? "Sending…" : "Send reset link"}
						</Button>
					</form>

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
