"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";

import type { CompleteOnboardingInput } from "./schemas";
import type { ApiEnvelope, OwnProfile, SendOtpResult, VerifyOtpResult } from "./types";

async function parseEnvelope<T>(body: ApiEnvelope<T>): Promise<T> {
	if (!body.ok) {
		throw new Error("error" in body ? body.error : "Request failed");
	}
	return body.data;
}

export function useSendPhoneOtp() {
	const authFetch = useAuthenticatedFetch();

	return useMutation({
		mutationFn: async (phone_number: string) => {
			const body = await authFetch<ApiEnvelope<SendOtpResult>>("/api/onboarding/phone/send-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone_number }),
			});
			return parseEnvelope(body);
		},
		onSuccess: () => {
			toast.success("Verification code sent");
		},
		onError: (e: unknown) => {
			if (e instanceof ApiError && e.status === 429) {
				toast.error("Too many attempts. Try again later.");
				return;
			}
			const msg = e instanceof Error ? e.message : "Could not send code";
			toast.error(msg);
		},
	});
}

export function useVerifyPhoneOtp() {
	const authFetch = useAuthenticatedFetch();

	return useMutation({
		mutationFn: async (input: { phone_number: string; code: string }) => {
			const body = await authFetch<ApiEnvelope<VerifyOtpResult>>(
				"/api/onboarding/phone/verify-otp",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				},
			);
			return parseEnvelope(body);
		},
		onSuccess: () => {
			toast.success("Phone verified");
		},
		onError: (e: unknown) => {
			if (e instanceof ApiError && e.status === 400) {
				const b = e.body as { error?: string } | undefined;
				toast.error(typeof b?.error === "string" ? b.error : "Verification failed");
				return;
			}
			const msg = e instanceof Error ? e.message : "Verification failed";
			toast.error(msg);
		},
	});
}

/** OTP send + verify mutations for the onboarding phone steps. */
export function useOtpFlow() {
	const send = useSendPhoneOtp();
	const verify = useVerifyPhoneOtp();

	return {
		sendPhoneOtp: send,
		verifyPhoneOtp: verify,
	};
}

export function useCompleteOnboarding() {
	const authFetch = useAuthenticatedFetch();
	const router = useRouter();

	return useMutation({
		mutationFn: async (input: CompleteOnboardingInput) => {
			const body = await authFetch<ApiEnvelope<OwnProfile>>("/api/onboarding/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return parseEnvelope(body);
		},
		onSuccess: () => {
			router.refresh();
			router.push("/buyer");
			toast.success("Welcome — you are all set");
		},
		onError: (e: unknown) => {
			if (e instanceof ApiError && e.status === 409) {
				const b = e.body as { error?: string } | undefined;
				toast.error(typeof b?.error === "string" ? b.error : "Could not complete signup");
				return;
			}
			const msg = e instanceof Error ? e.message : "Could not complete signup";
			toast.error(msg);
		},
	});
}
