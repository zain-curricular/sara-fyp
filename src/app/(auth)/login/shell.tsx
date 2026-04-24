// ============================================================================
// Login Shell
// ============================================================================
//
// Unified sign-in / sign-up shell. Two tabs: "Log in" and "Sign up".
// Log-in tab: email + password + Google OAuth + forgot-password link.
// Sign-up tab: full name + email + password + confirm password + Google OAuth.
//
// After successful auth: calls GET /api/auth/me to resolve roles, then
// redirects to ?next= param or role-based default (/admin, /seller, /buyer).
//
// Client component — all Supabase auth is done in the browser via
// createBrowserSupabaseClient.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type TabId = "login" | "signup";

interface LoginShellProps {
	defaultTab?: TabId;
	next?: string;
}

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------

const loginSchema = z.object({
	email: z.string().email("Enter a valid email"),
	password: z.string().min(1, "Password is required"),
});

const signupSchema = z
	.object({
		fullName: z.string().min(2, "Enter your full name"),
		email: z.string().email("Enter a valid email"),
		password: z.string().min(8, "Use at least 8 characters"),
		confirm: z.string().min(1, "Confirm your password"),
	})
	.refine((d) => d.password === d.confirm, {
		message: "Passwords must match",
		path: ["confirm"],
	});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Resolve post-auth redirect URL based on roles. */
function resolveRedirect(roles: string[], activeRole: string, next?: string): string {
	if (next) return next;
	if (activeRole === "admin" || roles.includes("admin")) return "/admin";
	if (activeRole === "seller" || roles.includes("seller")) return "/seller";
	return "/buyer";
}

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

// ----------------------------------------------------------------------------
// Login tab form
// ----------------------------------------------------------------------------

function LoginForm({ next }: { next?: string }) {
	const router = useRouter();

	const form = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	async function onSubmit({ email, password }: LoginForm) {
		const supabase = createBrowserSupabaseClient();

		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			toast.error(error.message);
			return;
		}

		// Fetch roles to decide where to redirect
		const res = await fetch("/api/auth/me");
		const json = await res.json();

		router.refresh();

		if (json.ok) {
			router.push(resolveRedirect(json.data.roles, json.data.activeRole, next));
		} else {
			router.push(next ?? "/buyer");
		}
	}

	return (
		<form
			container-id="login-form"
			className="flex flex-col gap-4"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<FieldSet>
				<FieldGroup>

					<Field data-invalid={!!form.formState.errors.email}>
						<FieldLabel htmlFor="li_email">Email</FieldLabel>
						<Input
							autoComplete="email"
							id="li_email"
							type="email"
							{...form.register("email")}
						/>
						<FieldError errors={[form.formState.errors.email]} />
					</Field>

					<Field data-invalid={!!form.formState.errors.password}>
						<FieldLabel htmlFor="li_password">Password</FieldLabel>
						<Input
							autoComplete="current-password"
							id="li_password"
							type="password"
							{...form.register("password")}
						/>
						<FieldError errors={[form.formState.errors.password]} />
					</Field>

				</FieldGroup>
			</FieldSet>

			<div container-id="login-form-actions" className="flex items-center justify-between text-xs">
				<Link
					href="/forgot-password"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					Forgot password?
				</Link>
			</div>

			<Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
				{form.formState.isSubmitting ? "Signing in…" : "Sign in →"}
			</Button>
		</form>
	);
}

// ----------------------------------------------------------------------------
// Sign-up tab form
// ----------------------------------------------------------------------------

function SignupForm({ next }: { next?: string }) {
	const router = useRouter();

	const form = useForm<SignupForm>({
		resolver: zodResolver(signupSchema),
		defaultValues: { fullName: "", email: "", password: "", confirm: "" },
	});

	async function onSubmit({ fullName, email, password }: SignupForm) {
		const supabase = createBrowserSupabaseClient();

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { full_name: fullName } },
		});

		if (error) {
			toast.error(error.message);
			return;
		}

		if (!data.session) {
			toast.success("Check your email to confirm your account, then sign in.");
			return;
		}

		const res = await fetch("/api/auth/me");
		const json = await res.json();

		router.refresh();

		if (json.ok) {
			router.push(resolveRedirect(json.data.roles, json.data.activeRole, next));
		} else {
			router.push(next ?? "/buyer");
		}
	}

	return (
		<form
			container-id="signup-form"
			className="flex flex-col gap-4"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<FieldSet>
				<FieldGroup>

					<Field data-invalid={!!form.formState.errors.fullName}>
						<FieldLabel htmlFor="su_name">Full name</FieldLabel>
						<Input
							autoComplete="name"
							id="su_name"
							type="text"
							{...form.register("fullName")}
						/>
						<FieldError errors={[form.formState.errors.fullName]} />
					</Field>

					<Field data-invalid={!!form.formState.errors.email}>
						<FieldLabel htmlFor="su_email">Email</FieldLabel>
						<Input
							autoComplete="email"
							id="su_email"
							type="email"
							{...form.register("email")}
						/>
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

			<Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
				{form.formState.isSubmitting ? "Creating account…" : "Create account →"}
			</Button>
		</form>
	);
}

// ----------------------------------------------------------------------------
// OAuth section
// ----------------------------------------------------------------------------

function OAuthSection({ next }: { next?: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function handleGoogle() {
		setLoading(true);
		const supabase = createBrowserSupabaseClient();

		const redirectTo =
			typeof window !== "undefined"
				? `${window.location.origin}/api/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
				: "/api/auth/callback";

		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo },
		});

		if (error) {
			toast.error(error.message);
			setLoading(false);
		}
		// On success: Supabase redirects the browser — no manual push needed
	}

	return (
		<div container-id="login-oauth" className="flex flex-col gap-3">

			<div container-id="login-divider" className="flex items-center gap-3">
				<span className="flex-1 border-t border-border" />
				<span className="text-[10px] text-muted-foreground">or</span>
				<span className="flex-1 border-t border-border" />
			</div>

			<button
				type="button"
				disabled={loading}
				onClick={handleGoogle}
				className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}
			>
				<GoogleIcon />
				{loading ? "Redirecting…" : "Continue with Google"}
			</button>

		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Unified auth shell with login/signup tabs and Google OAuth. */
export default function LoginShell({ defaultTab = "login", next }: LoginShellProps) {
	const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

	return (
		<div container-id="login-shell" className="w-full max-w-md">

			<Card>
				<CardHeader className="text-center">
					<div container-id="login-brand" className="mb-1 flex justify-center">
						<div className="flex items-center gap-1.5">
							<span className="size-2.5 rounded-full bg-brand" />
							<span className="text-sm font-bold tracking-tight">
								Shop<span className="text-primary">Smart</span>
							</span>
						</div>
					</div>
					<CardTitle className="text-2xl font-bold tracking-tight">
						{activeTab === "login" ? "Welcome back" : "Create your account"}
					</CardTitle>
					<CardDescription>
						{activeTab === "login"
							? "Sign in to your ShopSmart account"
							: "Join thousands of buyers and sellers"}
					</CardDescription>
				</CardHeader>

				<CardContent className="flex flex-col gap-5">

					{/* Tab switcher */}
					<div
						container-id="login-tabs"
						className="flex rounded-lg border border-border bg-muted/40 p-1"
					>
						{(["login", "signup"] as const).map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => setActiveTab(tab)}
								className={cn(
									"flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
									activeTab === tab
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{tab === "login" ? "Log in" : "Sign up"}
							</button>
						))}
					</div>

					{/* Active form */}
					{activeTab === "login" ? (
						<LoginForm next={next} />
					) : (
						<SignupForm next={next} />
					)}

					{/* Google OAuth */}
					<OAuthSection next={next} />

					{/* Bottom switch */}
					<p className="text-center text-xs text-muted-foreground">
						{activeTab === "login" ? (
							<>
								No account?{" "}
								<button
									type="button"
									onClick={() => setActiveTab("signup")}
									className="font-medium text-foreground hover:text-primary transition-colors"
								>
									Sign up free
								</button>
							</>
						) : (
							<>
								Already have an account?{" "}
								<button
									type="button"
									onClick={() => setActiveTab("login")}
									className="font-medium text-foreground hover:text-primary transition-colors"
								>
									Log in
								</button>
							</>
						)}
					</p>

				</CardContent>
			</Card>

		</div>
	);
}
