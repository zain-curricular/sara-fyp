"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { OtpInput } from "@/components/onboarding/otp-input";
import { Button } from "@/components/primitives/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { useOtpFlow } from "@/lib/features/onboarding/hooks";
import { verifyPhoneOtpSchema } from "@/lib/features/onboarding/schemas";
import type { z } from "zod";

type FormValues = z.infer<typeof verifyPhoneOtpSchema>;

export default function OnboardingVerifyShell({ phone }: { phone: string }) {
	const router = useRouter();
	const { verifyPhoneOtp } = useOtpFlow();

	const form = useForm<FormValues>({
		resolver: zodResolver(verifyPhoneOtpSchema),
		defaultValues: { phone_number: phone, code: "" },
	});

	return (
		<div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
			<div className="space-y-1 text-center">
				<h1 className="text-xl font-semibold">Enter the code</h1>
				<p className="text-sm text-muted-foreground">We sent a 6-digit code to your phone.</p>
			</div>
			<form
				className="space-y-6"
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
							<FieldLabel htmlFor="code">6-digit code</FieldLabel>
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
				<Button className="w-full" disabled={verifyPhoneOtp.isPending} type="submit">
					{verifyPhoneOtp.isPending ? "Verifying…" : "Verify and continue"}
				</Button>
			</form>
			<p className="text-center text-xs text-muted-foreground">
				Number: <span className="font-mono text-foreground">{phone}</span>
			</p>
		</div>
	);
}
