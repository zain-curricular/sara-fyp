// ============================================================================
// Sign-Up Shell
// ============================================================================
//
// Split-screen layout (Wireframe Variant B).
// Left pane  — form: logo, "signup · step 1 of 3", "Join 40k+ buyers",
//              email + password + confirm, "Create account →", — or — divider,
//              disabled OAuth row, "Already have an account? Log in".
// Right pane — orange-tinted trust panel: "why mobilemart" label, headline,
//              three feature cards (Tested / Escrow / Warranty), testimonial.
//              Hidden on mobile, visible at lg breakpoint.
//
// Auth: Supabase signUp. On session → router.push("/continue").
//       On email-confirm flow → toast and stay.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/primitives/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const signUpSchema = z
	.object({
		email: z.string().email("Enter a valid email"),
		password: z.string().min(8, "Use at least 8 characters"),
		confirm: z.string().min(1, "Confirm your password"),
	})
	.refine((d) => d.password === d.confirm, {
		message: "Passwords must match",
		path: ["confirm"],
	});

type SignUpForm = z.infer<typeof signUpSchema>;

// ----------------------------------------------------------------------------
// Trust panel data
// ----------------------------------------------------------------------------

const TRUST_FEATURES = [
	{
		icon: "✓",
		title: "Tested & certified",
		body: "Every phone passes a 32-point inspection before it's listed.",
	},
	{
		icon: "🔒",
		title: "Escrow protection",
		body: "Payment is held securely until you confirm you're happy.",
	},
	{
		icon: "🛡",
		title: "3-month warranty",
		body: "Guaranteed coverage on every purchase, no questions asked.",
	},
] as const;

// ----------------------------------------------------------------------------
// OAuth icon helpers
// ----------------------------------------------------------------------------

function GoogleIcon() {
	return (
		<svg aria-hidden className="size-4 shrink-0" viewBox="0 0 24 24">
			<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
			<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
			<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
			<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
		</svg>
	);
}

function AppleIcon() {
	return (
		<svg aria-hidden className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z" />
		</svg>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Sign-up form with split-screen trust panel on desktop. */
export default function SignUpShell() {
	const router = useRouter();
	const [agreed, setAgreed] = useState(false);

	const form = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { email: "", password: "", confirm: "" },
	});

	return (
		<div
			container-id="sign-up-card"
			className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid lg:grid-cols-[minmax(0,1fr)_340px]"
		>

			{/* ── Left pane — form ── */}
			<div container-id="sign-up-form-pane" className="flex flex-col gap-5 p-6 sm:p-8 lg:p-10">

				{/* Brand mark */}
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-full bg-brand" />
					<span className="text-sm font-bold tracking-tight">
						mobile<span className="text-primary">mart</span>
					</span>
				</div>

				{/* Step label + heading */}
				<div className="flex flex-col gap-1">
					<p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
						signup · step 1 of 3
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Join 40k+ buyers</h1>
				</div>

				{/* Form */}
				<form
					container-id="sign-up-form"
					className="flex flex-col gap-4"
					onSubmit={form.handleSubmit(async ({ email, password }) => {
						const supabase = createBrowserSupabaseClient();
						const { data, error } = await supabase.auth.signUp({ email, password });
						if (error) {
							toast.error(error.message);
							return;
						}
						if (data.session) {
							router.refresh();
							router.push("/continue");
							return;
						}
						toast.success("Check your email to confirm your account, then sign in.");
					})}
				>
					<FieldSet>
						<FieldGroup>
							<Field data-invalid={!!form.formState.errors.email}>
								<FieldLabel htmlFor="su_email">Email</FieldLabel>
								<Input autoComplete="email" id="su_email" type="email" {...form.register("email")} />
								<FieldError errors={[form.formState.errors.email]} />
							</Field>
							<Field data-invalid={!!form.formState.errors.password}>
								<FieldLabel htmlFor="su_password">Password</FieldLabel>
								<Input
									autoComplete="new-password"
									id="su_password"
									type="password"
									placeholder="8+ characters"
									{...form.register("password")}
								/>
								<FieldError errors={[form.formState.errors.password]} />
							</Field>
							<Field data-invalid={!!form.formState.errors.confirm}>
								<FieldLabel htmlFor="su_confirm">Confirm password</FieldLabel>
								<Input
									autoComplete="new-password"
									id="su_confirm"
									type="password"
									{...form.register("confirm")}
								/>
								<FieldError errors={[form.formState.errors.confirm]} />
							</Field>
						</FieldGroup>
					</FieldSet>

					{/* Terms checkbox */}
					<label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
						<input
							type="checkbox"
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
							className="mt-0.5 rounded border-border accent-primary"
						/>
						<span>
							I agree to the{" "}
							<Link href="/terms" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link href="/privacy" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
								Privacy Policy
							</Link>
						</span>
					</label>

					<Button
						className="w-full"
						disabled={form.formState.isSubmitting || !agreed}
						type="submit"
					>
						{form.formState.isSubmitting ? "Creating account…" : "Create account →"}
					</Button>
				</form>

				{/* — or — divider */}
				<div container-id="sign-up-divider" className="flex items-center gap-3">
					<span className="flex-1 border-t border-border" />
					<span className="text-[10px] text-muted-foreground">or</span>
					<span className="flex-1 border-t border-border" />
				</div>

				{/* OAuth — not yet wired */}
				<div container-id="sign-up-oauth" className="flex flex-col gap-2">
					<button
						type="button"
						disabled
						className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2 opacity-50")}
					>
						<GoogleIcon />
						Continue with Google
					</button>
					<button
						type="button"
						disabled
						className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2 opacity-50")}
					>
						<AppleIcon />
						Continue with Apple
					</button>
				</div>

				<p className="text-center text-xs text-muted-foreground">
					Already have an account?{" "}
					<Link href="/sign-in" className="font-medium text-foreground hover:text-primary transition-colors">
						Log in
					</Link>
				</p>
			</div>

			{/* ── Right pane — trust panel (desktop only) ── */}
			<div
				container-id="sign-up-trust-panel"
				className="hidden flex-col gap-6 border-l border-border bg-primary/[0.05] p-8 lg:flex"
			>

				{/* Label */}
				<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
					why mobilemart
				</p>

				{/* Headline */}
				<h2 className="text-xl font-bold leading-snug tracking-tight">
					Phones you can<br />actually trust.
				</h2>

				{/* Feature cards */}
				<div container-id="trust-features" className="flex flex-col gap-3">
					{TRUST_FEATURES.map((f) => (
						<div
							key={f.title}
							className="flex flex-col gap-1 rounded-xl border border-border bg-background/60 p-4"
						>
							<div className="flex items-center gap-2">
								<span className="text-base" aria-hidden>{f.icon}</span>
								<p className="text-sm font-semibold">{f.title}</p>
							</div>
							<p className="text-xs leading-relaxed text-muted-foreground">{f.body}</p>
						</div>
					))}
				</div>

				{/* Testimonial */}
				<blockquote className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] p-4">
					<p className="text-sm leading-relaxed text-foreground/80">
						"I was scared to buy second-hand. mobilemart changed that completely."
					</p>
					<cite className="text-[11px] font-medium not-italic text-muted-foreground">
						— Aisha K., Karachi
					</cite>
				</blockquote>
			</div>
		</div>
	);
}
