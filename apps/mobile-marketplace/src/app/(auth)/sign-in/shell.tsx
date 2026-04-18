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

const signInSchema = z.object({
	email: z.string().email("Enter a valid email"),
	password: z.string().min(1, "Password is required"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInShell() {
	const router = useRouter();

	const form = useForm<SignInForm>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	return (
		<div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
			<div className="space-y-1 text-center">
				<h1 className="text-xl font-semibold">Sign in</h1>
				<p className="text-sm text-muted-foreground">Use your email and password to continue.</p>
			</div>
			<form
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
					{form.formState.isSubmitting ? "Signing in…" : "Sign in"}
				</Button>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				No account?{" "}
				<Link className="font-medium text-foreground underline underline-offset-4" href="/sign-up">
					Create one
				</Link>
			</p>
		</div>
	);
}
