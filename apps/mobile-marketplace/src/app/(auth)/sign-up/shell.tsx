"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/primitives/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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

export default function SignUpShell() {
	const router = useRouter();

	const form = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { email: "", password: "", confirm: "" },
	});

	return (
		<div
			container-id="sign-up-card"
			className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
		>
			<div container-id="sign-up-header" className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
				<p className="text-sm text-muted-foreground">
					Sign up with email and password to get started.
				</p>
			</div>
			<form
				className="space-y-5"
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
					{form.formState.isSubmitting ? "Creating account…" : "Sign up"}
				</Button>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link className="font-medium text-foreground underline underline-offset-4" href="/sign-in">
					Sign in
				</Link>
			</p>
		</div>
	);
}
