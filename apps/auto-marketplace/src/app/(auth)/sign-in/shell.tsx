// ============================================================================
// Sign-In Shell
// ============================================================================
//
// Centered card layout. Logo mark → "login" label → "welcome back" heading →
// email/password fields → "Sign in →" CTA → footer with forgot-password +
// sign-up links → "— or —" divider → disabled OAuth.
//
// Auth: Supabase signInWithPassword, then router.push("/continue").

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const signInSchema = z.object({
	email: z.string().email("Enter a valid email"),
	password: z.string().min(1, "Password is required"),
});

type SignInForm = z.infer<typeof signInSchema>;

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

/** Sign-in form — email/password with Supabase auth. */
export default function SignInShell() {
	const router = useRouter();

	const form = useForm<SignInForm>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	return (
		<div
			container-id="sign-in-card"
			className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
		>

			{/* Brand mark + label */}
			<div container-id="sign-in-brand" className="flex flex-col items-center gap-1">
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-full bg-brand" />
					<span className="text-sm font-bold tracking-tight">
						auto<span className="text-primary">mart</span>
					</span>
				</div>
				<p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
					login
				</p>
			</div>

			<h1 container-id="sign-in-heading" className="text-center text-2xl font-bold tracking-tight">
				welcome back
			</h1>

			{/* Form */}
			<form
				container-id="sign-in-form"
				className="space-y-4"
				onSubmit={form.handleSubmit(async ({ email, password }) => {
					const supabase = createBrowserSupabaseClient();
					const { error } = await supabase.auth.signInWithPassword({ email, password });
					if (error) {
						toast.error(error.message);
						return;
					}
					router.refresh();
					router.push("/continue");
				})}
			>
				<FieldSet>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.email}>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input autoComplete="email" id="email" type="email" {...form.register("email")} />
							<FieldError errors={[form.formState.errors.email]} />
						</Field>
						<Field data-invalid={!!form.formState.errors.password}>
							<FieldLabel htmlFor="password">Password</FieldLabel>
							<Input
								autoComplete="current-password"
								id="password"
								type="password"
								{...form.register("password")}
							/>
							<FieldError errors={[form.formState.errors.password]} />
						</Field>
					</FieldGroup>
				</FieldSet>
				<Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
					{form.formState.isSubmitting ? "Signing in…" : "Sign in →"}
				</Button>
			</form>

			{/* Footer links */}
			<div container-id="sign-in-footer" className="flex items-center justify-between text-xs">
				<Link
					href="/forgot-password"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					Forgot password?
				</Link>
				<Link href="/sign-up" className="font-medium text-foreground hover:text-primary transition-colors">
					New here? Sign up
				</Link>
			</div>

			{/* — or — divider */}
			<div container-id="sign-in-divider" className="flex items-center gap-3">
				<span className="flex-1 border-t border-border" />
				<span className="text-[10px] text-muted-foreground">or</span>
				<span className="flex-1 border-t border-border" />
			</div>

			{/* OAuth buttons — not yet wired */}
			<div container-id="sign-in-oauth" className="flex flex-col gap-2">
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
		</div>
	);
}
