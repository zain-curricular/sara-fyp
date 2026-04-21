"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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
import type { z } from "zod";

type FormValues = z.infer<typeof sendPhoneOtpSchema>;

export default function OnboardingPhoneShell({
	initialPhone = null,
}: {
	initialPhone?: string | null;
}) {
	const router = useRouter();
	const { sendPhoneOtp } = useOtpFlow();

	const form = useForm<FormValues>({
		resolver: zodResolver(sendPhoneOtpSchema),
		defaultValues: { phone_number: initialPhone ?? "" },
	});

	return (
		<div
			container-id="onboarding-phone-card"
			className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
		>
			<div container-id="onboarding-phone-header" className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">Verify your phone</h1>
				<p className="text-sm text-muted-foreground">
					We will send a 6-digit code to your number (E.164 format, e.g. +923001234567).
				</p>
			</div>
			<form
				className="space-y-6"
				onSubmit={form.handleSubmit(async (values) => {
					await sendPhoneOtp.mutateAsync(values.phone_number);
					router.push(`/onboarding/verify?phone=${encodeURIComponent(values.phone_number)}`);
				})}
			>
				<FieldSet>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.phone_number}>
							<FieldLabel htmlFor="phone_number">Phone number</FieldLabel>
							<FieldDescription>Include country code.</FieldDescription>
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
					{sendPhoneOtp.isPending ? "Sending…" : "Send code"}
				</Button>
			</form>
		</div>
	);
}
