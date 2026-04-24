// ============================================================================
// Onboarding — Verify Shell
// ============================================================================
//
// Step 2 of 3: enter the 6-digit OTP sent to the user's phone.
// Uses OtpInput via react-hook-form Controller.
// Verifies via useOtpFlow().verifyPhoneOtp, then navigates to profile.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { OtpInput } from "../_components/otp-input";
import { Button } from "@/components/primitives/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { useOtpFlow } from "@/lib/features/onboarding/hooks";
import { verifyPhoneOtpSchema } from "@/lib/features/onboarding/schemas";

type FormInput = z.input<typeof verifyPhoneOtpSchema>;
type FormOutput = z.infer<typeof verifyPhoneOtpSchema>;

/** Onboarding step 2: OTP code entry and verification. */
export default function OnboardingVerifyShell({ phone }: { phone: string }) {
	const router = useRouter();
	const { verifyPhoneOtp } = useOtpFlow();

	const form = useForm<FormInput, unknown, FormOutput>({
		resolver: zodResolver(verifyPhoneOtpSchema),
		defaultValues: { phone_number: phone, code: "" },
	});

	return (
		<div
			container-id="onboarding-verify-card"
			className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
		>

			{/* Icon + heading */}
			<div container-id="onboarding-verify-header" className="flex flex-col items-center gap-3">
				<div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
					<MessageSquare className="size-5 text-primary" aria-hidden />
				</div>
				<div className="space-y-1 text-center">
					<h1 className="text-xl font-bold tracking-tight">Enter the code</h1>
					<p className="text-sm text-muted-foreground">
						We sent a 6-digit code to{" "}
						<span className="font-mono text-xs font-medium text-foreground">{phone}</span>
					</p>
				</div>
			</div>

			<form
				container-id="onboarding-verify-form"
				className="space-y-5"
				onSubmit={form.handleSubmit(async (values) => {
					await verifyPhoneOtp.mutateAsync({
						phone_number: values.phone_number,
						code: values.code,
					});
					router.push("/onboarding/profile");
				})}
			>
				<FieldSet>
					<FieldGroup>
						<input type="hidden" {...form.register("phone_number")} />
						<Field data-invalid={!!form.formState.errors.code}>
							<FieldLabel htmlFor="code" className="sr-only">6-digit code</FieldLabel>
							<Controller
								control={form.control}
								name="code"
								render={({ field }) => (
									<OtpInput
										aria-invalid={!!form.formState.errors.code}
										id="code"
										value={field.value}
										onChange={(code) => field.onChange(code)}
									/>
								)}
							/>
							<FieldError errors={[form.formState.errors.code]} />
						</Field>
					</FieldGroup>
				</FieldSet>
				<Button
					className="w-full"
					disabled={verifyPhoneOtp.isPending || form.watch("code").length < 6}
					type="submit"
				>
					{verifyPhoneOtp.isPending ? "Verifying…" : "Verify and continue →"}
				</Button>
			</form>

			<p className="text-center text-xs text-muted-foreground">
				Didn't get a code?{" "}
				<button
					type="button"
					className="font-medium text-foreground hover:text-primary transition-colors"
					onClick={() => router.back()}
				>
					Go back and retry
				</button>
			</p>
		</div>
	);
}
