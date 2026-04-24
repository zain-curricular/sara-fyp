// ============================================================================
// Onboarding — Phone Shell
// ============================================================================
//
// Step 1 of 3: collect and submit a phone number for OTP verification.
// Sends via useOtpFlow().sendPhoneOtp, then navigates to /onboarding/verify.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
import { useOtpFlow } from "@/lib/features/onboarding/hooks";
import { sendPhoneOtpSchema } from "@/lib/features/onboarding/schemas";

type FormInput = z.input<typeof sendPhoneOtpSchema>;
type FormOutput = z.infer<typeof sendPhoneOtpSchema>;

/** Onboarding step 1: phone number entry. */
export default function OnboardingPhoneShell({
	initialPhone = null,
	emailVerified = false,
}: {
	initialPhone?: string | null;
	emailVerified?: boolean;
}) {
	const router = useRouter();
	const { sendPhoneOtp } = useOtpFlow();

	const form = useForm<FormInput, unknown, FormOutput>({
		resolver: zodResolver(sendPhoneOtpSchema),
		defaultValues: { phone_number: initialPhone ?? "" },
	});

	return (
		<div
			container-id="onboarding-phone-card"
			className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
		>

			{/* Icon + heading */}
			<div container-id="onboarding-phone-header" className="flex flex-col items-center gap-3">
				<div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
					<Phone className="size-5 text-primary" aria-hidden />
				</div>
				<div className="space-y-1 text-center">
					<h1 className="text-xl font-bold tracking-tight">Verify your number</h1>
					<p className="text-sm text-muted-foreground">
						We'll send a 6-digit code to confirm it's you.
					</p>
				</div>
			</div>

			<form
				container-id="onboarding-phone-form"
				className="space-y-5"
				onSubmit={form.handleSubmit(async (values) => {
					await sendPhoneOtp.mutateAsync(values.phone_number);
					router.push(`/onboarding/verify?phone=${encodeURIComponent(values.phone_number)}`);
				})}
			>
				<FieldSet>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.phone_number}>
							<FieldLabel htmlFor="phone_number">Phone number</FieldLabel>
							<FieldDescription>International format — e.g. +923001234567</FieldDescription>
							<Input
								id="phone_number"
								autoComplete="tel"
								inputMode="tel"
								placeholder="+923001234567"
								type="tel"
								{...form.register("phone_number")}
							/>
							<FieldError errors={[form.formState.errors.phone_number]} />
						</Field>
					</FieldGroup>
				</FieldSet>
				<Button className="w-full" disabled={sendPhoneOtp.isPending} type="submit">
					{sendPhoneOtp.isPending ? "Sending…" : "Send code →"}
				</Button>
			</form>
			{emailVerified ? (
				<Button
					className="w-full"
					type="button"
					variant="ghost"
					onClick={() => {
						router.push("/onboarding/profile");
					}}
				>
					Skip — continue with verified email
				</Button>
			) : null}
		</div>
	);
}
