import type { OwnProfile } from "@/lib/features/profiles/types";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiEnvelope<T> = ApiOk<T> | ApiErr;

export type SendOtpResult = { sent: true };

/** Response data from verify-otp (profile row subset from backend). */
export type VerifyOtpResult = { phone_verified: boolean };

export type { OwnProfile };
